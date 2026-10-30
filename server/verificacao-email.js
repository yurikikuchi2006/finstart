import {
  randomBytes,
  randomInt,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { prepararCadastro } from "./controllers.js";
const erro = (status, message) => Object.assign(Error(message), { status });
const invalido = () =>
  erro(400, "Código inválido ou expirado. Solicite um novo código.");
export function verificacaoEmail(
  db,
  secret,
  controllers,
  { sendCode, now = () => Math.floor(Date.now() / 1000) },
) {
  const digest = (value) =>
    createHmac("sha256", secret).update(value).digest("hex");
  const codeHash = (id, code) => digest(`codigo:${id}:${code}`);
  async function reservar(email) {
    const time = now();
    await db.transaction(async (tx) => {
      for (const limit of [
        { key: digest("email:" + email), period: 3600, max: 5, cooldown: 60 },
        { key: digest("global-email"), period: 86400, max: 250, cooldown: 0 },
      ]) {
        const window = Math.floor(time / limit.period) * limit.period;
        let row = await tx
          .prepare("SELECT * FROM email_limites WHERE chave=?")
          .get(limit.key);
        if (!row) {
          try {
            await tx
              .prepare(
                "INSERT INTO email_limites(chave,janela,usados,proximo_envio) VALUES(?,?,?,?)",
              )
              .run(limit.key, window, 0, 0);
          } catch (e) {
            if (
              e.code !== "ER_DUP_ENTRY" &&
              !String(e.message).includes("UNIQUE constraint")
            )
              throw e;
          }
          row = await tx
            .prepare("SELECT * FROM email_limites WHERE chave=?")
            .get(limit.key);
        }
        const used = row.janela === window ? row.usados : 0;
        if (row.proximo_envio > time || used >= limit.max)
          throw erro(
            429,
            "Limite de envio atingido. Aguarde antes de solicitar outro código.",
          );
        const r = await tx
          .prepare(
            "UPDATE email_limites SET janela=?,usados=?,proximo_envio=? WHERE chave=? AND janela=? AND usados=? AND proximo_envio=?",
          )
          .run(
            window,
            used + 1,
            time + limit.cooldown,
            limit.key,
            row.janela,
            row.usados,
            row.proximo_envio,
          );
        if (!r.changes)
          throw erro(
            429,
            "Já existe uma solicitação em andamento. Aguarde antes de tentar novamente.",
          );
      }
      await tx
        .prepare("DELETE FROM desafios_email WHERE expira_em<?")
        .run(time);
    });
  }
  const resposta = (row) => ({
    desafio_id: row.id,
    finalidade: row.finalidade,
    expira_em: row.expira_em,
    reenvio_em: row.enviado_em + 60,
    mensagem:
      "Enviamos um código para o e-mail informado. Confira também o spam.",
  });
  async function enviar(row, code) {
    try {
      await sendCode({ email: row.email, code, purpose: row.finalidade });
    } catch {
      await db
        .prepare("DELETE FROM desafios_email WHERE id=? AND codigo_hash=?")
        .run(row.id, row.codigo_hash);
      throw erro(
        503,
        "Não foi possível enviar o código agora. Aguarde um minuto e tente novamente.",
      );
    }
    return resposta(row);
  }
  async function iniciar(body, finalidade) {
    let account;
    if (finalidade === "cadastro") {
      account = prepararCadastro(body);
      if (
        await db
          .prepare("SELECT id FROM usuarios WHERE email=?")
          .get(account.email)
      )
        throw erro(409, "E-mail já cadastrado. Entre na sua conta.");
    } else account = await controllers.validarCredenciais(body);
    await reservar(account.email);
    const code = String(randomInt(1000000)).padStart(6, "0");
    const id = randomBytes(32).toString("hex");
    const row = {
      id,
      finalidade,
      email: account.email,
      nome: account.nome,
      senha_hash: finalidade === "cadastro" ? account.senha_hash : null,
      usuario_id: account.id ?? null,
      codigo_hash: codeHash(id, code),
      expira_em: now() + 600,
      enviado_em: now(),
    };
    await db.transaction(async (tx) => {
      await tx
        .prepare("DELETE FROM desafios_email WHERE email=?")
        .run(row.email);
      await tx
        .prepare(
          "INSERT INTO desafios_email(id,finalidade,email,nome,senha_hash,usuario_id,codigo_hash,expira_em,enviado_em,tentativas) VALUES(?,?,?,?,?,?,?,?,?,0)",
        )
        .run(
          row.id,
          row.finalidade,
          row.email,
          row.nome,
          row.senha_hash,
          row.usuario_id,
          row.codigo_hash,
          row.expira_em,
          row.enviado_em,
        );
    });
    return enviar(row, code);
  }
  async function reenviar({ desafio_id }) {
    if (typeof desafio_id !== "string" || !/^[a-f0-9]{64}$/.test(desafio_id))
      throw invalido();
    const old = await db
      .prepare("SELECT * FROM desafios_email WHERE id=?")
      .get(desafio_id);
    if (!old || old.expira_em <= now()) throw invalido();
    await reservar(old.email);
    let code;
    do {
      code = String(randomInt(1000000)).padStart(6, "0");
    } while (codeHash(old.id, code) === old.codigo_hash);
    const row = {
      ...old,
      codigo_hash: codeHash(old.id, code),
      expira_em: now() + 600,
      enviado_em: now(),
    };
    const r = await db
      .prepare(
        "UPDATE desafios_email SET codigo_hash=?,expira_em=?,enviado_em=?,tentativas=0 WHERE id=? AND codigo_hash=?",
      )
      .run(
        row.codigo_hash,
        row.expira_em,
        row.enviado_em,
        row.id,
        old.codigo_hash,
      );
    if (!r.changes) throw invalido();
    return enviar(row, code);
  }
  async function confirmar({ desafio_id, codigo }) {
    if (
      typeof desafio_id !== "string" ||
      !/^[a-f0-9]{64}$/.test(desafio_id) ||
      typeof codigo !== "string" ||
      !/^\d{6}$/.test(codigo)
    )
      throw invalido();
    const row = await db
      .prepare("SELECT * FROM desafios_email WHERE id=?")
      .get(desafio_id);
    if (!row || row.expira_em <= now() || row.tentativas >= 5) throw invalido();
    const expected = Buffer.from(row.codigo_hash, "hex"),
      actual = Buffer.from(codeHash(row.id, codigo), "hex");
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      await db
        .prepare(
          "UPDATE desafios_email SET tentativas=tentativas+1 WHERE id=? AND tentativas<5",
        )
        .run(row.id);
      throw invalido();
    }
    return db.transaction(async (tx) => {
      const claimed = await tx
        .prepare(
          "DELETE FROM desafios_email WHERE id=? AND codigo_hash=? AND expira_em>? AND tentativas<5",
        )
        .run(row.id, row.codigo_hash, now());
      if (!claimed.changes) throw invalido();
      let id = row.usuario_id;
      if (row.finalidade === "cadastro") {
        if (
          await tx
            .prepare("SELECT id FROM usuarios WHERE email=?")
            .get(row.email)
        )
          throw erro(409, "E-mail já cadastrado. Entre na sua conta.");
        const inserted = await tx
          .prepare(
            "INSERT INTO usuarios(nome,email,senha_hash,email_verificado_em) VALUES(?,?,?,?)",
          )
          .run(row.nome, row.email, row.senha_hash, now());
        id = Number(inserted.lastInsertRowid);
      } else {
        const user = await tx
          .prepare("SELECT id FROM usuarios WHERE id=? AND email=?")
          .get(id, row.email);
        if (!user) throw invalido();
        await tx
          .prepare(
            "UPDATE usuarios SET email_verificado_em=COALESCE(email_verificado_em,?) WHERE id=?",
          )
          .run(now(), id);
      }
      return controllers.abrirSessao(id, tx);
    });
  }
  return {
    iniciarCadastro: (body) => iniciar(body, "cadastro"),
    iniciarLogin: (body) => iniciar(body, "login"),
    reenviar,
    confirmar,
  };
}
