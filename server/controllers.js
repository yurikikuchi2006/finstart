import { projetar } from "../financas.js";
import { MetaFinanceira } from "../dominio.js";
import {
  hashSenha,
  conferirSenha,
  emitirToken,
  verificarToken,
} from "./auth.js";
const erro = (status, message) => Object.assign(Error(message), { status });
export function prepararCadastro({ nome, email, senha }) {
  if (
    typeof nome !== "string" ||
    nome.trim().length < 3 ||
    nome.trim().length > 50 ||
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof senha !== "string" ||
    senha.length < 8 ||
    senha.length > 128 ||
    !/\p{L}/u.test(senha) ||
    !/\d/.test(senha)
  )
    throw erro(
      400,
      "Informe nome (3–50 caracteres), e-mail válido e senha de 8–128 caracteres com letra e número.",
    );
  return {
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha_hash: hashSenha(senha),
  };
}
export function controllers(db, secret) {
  async function autenticar(req) {
    const token = /(?:^|;\s*)finstart=([^;]+)/.exec(
      req.headers.cookie || "",
    )?.[1];
    const claims = verificarToken(token || "", secret);
    const session = await db
      .prepare("SELECT usuario_id FROM sessoes WHERE id=? AND expira_em>?")
      .get(claims.jti, Math.floor(Date.now() / 1000));
    if (!session || String(session.usuario_id) !== claims.sub)
      throw erro(401, "Sessão encerrada. Entre novamente.");
    return claims;
  }
  const usuario = (id) =>
    db.prepare("SELECT id,nome,email FROM usuarios WHERE id=?").get(id);
  async function metaDoUsuario(req, id) {
    const uid = (await autenticar(req)).sub;
    const meta = await db
      .prepare("SELECT * FROM metas WHERE id=? AND usuario_id=?")
      .get(id, uid);
    if (!meta) throw erro(404, "Meta não encontrada.");
    return meta;
  }
  return {
    async conteudos() {
      const rows = await db
        .prepare(
          "SELECT c.id,c.titulo,c.texto,c.nivel,c.data_publicacao,c.fontes_json,k.nome categoria FROM conteudo c JOIN categoria k ON k.id=c.categoria_id ORDER BY c.id",
        )
        .all();
      return rows.map(({ fontes_json, ...r }) => ({
        ...r,
        fontes: JSON.parse(fontes_json),
      }));
    },
    async tipos() {
      return db
        .prepare("SELECT * FROM tipo_investimento ORDER BY taxa_anual_padrao")
        .all();
    },
    async comparar(body) {
      const tipos = await this.tipos();
      return tipos.map((t) => ({
        ...t,
        ...projetar({
          ...body,
          taxa: ((1 + t.taxa_anual_padrao / 100) ** (1 / 12) - 1) * 100,
        }),
      }));
    },
    async calcular(body) {
      return projetar(body);
    },
    async salvarComparacao(req, body) {
      const uid = (await autenticar(req)).sub;
      const resultados = await this.comparar(body);
      return db.transaction(async (tx) => {
        const r = await tx
          .prepare(
            "INSERT INTO juros(usuario_id,inicial_centavos,aporte_centavos,taxa,meses) VALUES(?,?,?,?,?)",
          )
          .run(uid, body.inicial_centavos, body.aporte_centavos, 0, body.meses);
        const id = Number(r.lastInsertRowid);
        for (const r of resultados)
          await tx
            .prepare(
              "INSERT INTO simulacao_investimento(juros_id,tipo_investimento_id,taxa_anual_aplicada,valor_final_centavos) VALUES(?,?,?,?)",
            )
            .run(id, r.id, r.taxa_anual_padrao, r.saldo_centavos);
        return { id, resultados: resultados.map(({ pontos, ...r }) => r) };
      });
    },
    async comparacoes(req) {
      return db
        .prepare(
          "SELECT s.juros_id,t.nome,s.taxa_anual_aplicada,s.valor_final_centavos,j.meses,j.criado_em FROM simulacao_investimento s JOIN tipo_investimento t ON t.id=s.tipo_investimento_id JOIN juros j ON j.id=s.juros_id WHERE j.usuario_id=? ORDER BY j.id DESC,t.id LIMIT 300",
        )
        .all((await autenticar(req)).sub);
    },
    async metas(req) {
      return (
        await db
          .prepare("SELECT * FROM metas WHERE usuario_id=? ORDER BY id DESC")
          .all((await autenticar(req)).sub)
      ).map((r) => new MetaFinanceira(r).toJSON());
    },
    async criarMeta(req, body) {
      const uid = (await autenticar(req)).sub;
      if (
        typeof body.titulo !== "string" ||
        body.titulo.trim().length < 3 ||
        body.titulo.trim().length > 80 ||
        !Number.isSafeInteger(body.alvo_centavos) ||
        body.alvo_centavos < 1 ||
        body.alvo_centavos > 100000000000
      )
        throw erro(
          400,
          "Informe título de 3 a 80 caracteres e objetivo entre R$ 0,01 e R$ 1 bilhão.",
        );
      const prazo = body.prazo_meses ?? null;
      if (
        prazo !== null &&
        (!Number.isInteger(prazo) || prazo < 1 || prazo > 600)
      )
        throw erro(400, "Prazo deve ser de 1 a 600 meses.");
      const r = await db
        .prepare(
          "INSERT INTO metas(usuario_id,titulo,alvo_centavos,prazo_meses,data_inicio) VALUES(?,?,?,?,?)",
        )
        .run(
          uid,
          body.titulo.trim(),
          body.alvo_centavos,
          prazo,
          new Date().toISOString().slice(0, 10),
        );
      return { id: Number(r.lastInsertRowid) };
    },
    async atualizarMeta(req, id, body) {
      const meta = await metaDoUsuario(req, id);
      const titulo = body.titulo ?? meta.titulo,
        alvo = body.alvo_centavos ?? meta.alvo_centavos,
        prazo = body.prazo_meses ?? meta.prazo_meses,
        guardado = body.guardado_centavos ?? meta.guardado_centavos;
      if (
        typeof titulo !== "string" ||
        titulo.trim().length < 3 ||
        titulo.trim().length > 80 ||
        !Number.isSafeInteger(alvo) ||
        alvo < 1 ||
        alvo > 100000000000 ||
        !Number.isSafeInteger(guardado) ||
        guardado < 0 ||
        guardado > alvo ||
        (prazo !== null &&
          (!Number.isInteger(prazo) || prazo < 1 || prazo > 600))
      )
        throw erro(400, "Confira título, valor, prazo e total guardado.");
      await db.transaction(async (tx) => {
        await tx
          .prepare(
            "UPDATE metas SET titulo=?,alvo_centavos=?,prazo_meses=?,guardado_centavos=?,status=? WHERE id=? AND usuario_id=?",
          )
          .run(
            titulo.trim(),
            alvo,
            prazo,
            guardado,
            guardado >= alvo ? "concluida" : "em_andamento",
            id,
            meta.usuario_id,
          );
        if (guardado !== meta.guardado_centavos)
          await tx
            .prepare(
              "INSERT INTO progresso_meta(meta_id,variacao_centavos,saldo_centavos) VALUES(?,?,?)",
            )
            .run(id, guardado - meta.guardado_centavos, guardado);
      });
    },
    async progresso(req, id) {
      await metaDoUsuario(req, id);
      return db
        .prepare(
          "SELECT id,variacao_centavos,saldo_centavos,data_registro FROM progresso_meta WHERE meta_id=? ORDER BY id",
        )
        .all(id);
    },
    async excluirMeta(req, id) {
      const r = await db
        .prepare("DELETE FROM metas WHERE id=? AND usuario_id=?")
        .run(id, (await autenticar(req)).sub);
      if (!r.changes) throw erro(404, "Meta não encontrada.");
    },
    async juros(req) {
      return (
        await db
          .prepare(
            "SELECT id,inicial_centavos,aporte_centavos,taxa,meses,criado_em FROM juros WHERE usuario_id=? AND NOT EXISTS (SELECT 1 FROM simulacao_investimento s WHERE s.juros_id=juros.id) ORDER BY id DESC LIMIT 100",
          )
          .all((await autenticar(req)).sub)
      ).map((r) => ({ ...r, saldo_centavos: projetar(r).saldo_centavos }));
    },
    async salvarJuros(req, body) {
      const uid = (await autenticar(req)).sub;
      projetar(body);
      const r = await db
        .prepare(
          "INSERT INTO juros(usuario_id,inicial_centavos,aporte_centavos,taxa,meses) VALUES(?,?,?,?,?)",
        )
        .run(
          uid,
          body.inicial_centavos,
          body.aporte_centavos,
          body.taxa,
          body.meses,
        );
      return { id: Number(r.lastInsertRowid) };
    },
    async excluirJuros(req, id) {
      const r = await db
        .prepare("DELETE FROM juros WHERE id=? AND usuario_id=?")
        .run(id, (await autenticar(req)).sub);
      if (!r.changes) throw erro(404, "Simulação não encontrada.");
    },
    async cadastrar(body) {
      const { nome, email, senha } = body;
      if (
        typeof nome !== "string" ||
        nome.trim().length < 3 ||
        nome.trim().length > 50 ||
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof senha !== "string" ||
        senha.length < 8 ||
        senha.length > 128 ||
        !/\p{L}/u.test(senha) ||
        !/\d/.test(senha)
      )
        throw erro(
          400,
          "Informe nome (3–50 caracteres), e-mail válido e senha de 8–128 caracteres com letra e número.",
        );
      const normalized = email.trim().toLowerCase();
      if (
        await db
          .prepare("SELECT id FROM usuarios WHERE email=?")
          .get(normalized)
      )
        throw erro(409, "E-mail já cadastrado.");
      try {
        const r = await db
          .prepare("INSERT INTO usuarios(nome,email,senha_hash) VALUES(?,?,?)")
          .run(nome.trim(), normalized, hashSenha(senha));
        return usuario(Number(r.lastInsertRowid));
      } catch (e) {
        if (
          e.code === "ER_DUP_ENTRY" ||
          String(e.message).includes("UNIQUE constraint")
        )
          throw erro(409, "E-mail já cadastrado.");
        throw e;
      }
    },
    async validarCredenciais(body) {
      if (
        typeof body.email !== "string" ||
        typeof body.senha !== "string" ||
        body.senha.length > 128
      )
        throw erro(400, "Informe e-mail e senha.");
      const row = await db
        .prepare("SELECT * FROM usuarios WHERE email=?")
        .get(body.email.trim().toLowerCase());
      const valid = conferirSenha(
        body.senha,
        row?.senha_hash || hashSenha("credencial-inexistente"),
      );
      if (!row || !valid) throw erro(401, "E-mail ou senha incorretos.");
      return { id: row.id, nome: row.nome, email: row.email };
    },
    async abrirSessao(id, banco = db) {
      const s = emitirToken(id, secret);
      await banco
        .prepare("DELETE FROM sessoes WHERE expira_em<=?")
        .run(Math.floor(Date.now() / 1000));
      await banco
        .prepare("INSERT INTO sessoes(id,usuario_id,expira_em) VALUES(?,?,?)")
        .run(s.claims.jti, id, s.claims.exp);
      return {
        token: s.token,
        usuario: await banco
          .prepare("SELECT id,nome,email FROM usuarios WHERE id=?")
          .get(id),
      };
    },
    async login(body) {
      return this.abrirSessao((await this.validarCredenciais(body)).id);
    },
    async me(req) {
      return usuario((await autenticar(req)).sub);
    },
    async logout(req) {
      const c = await autenticar(req);
      await db.prepare("DELETE FROM sessoes WHERE id=?").run(c.jti);
    },
    async listar(req) {
      return db
        .prepare(
          "SELECT id,renda_centavos,criado_em FROM simulacoes WHERE usuario_id=? ORDER BY id DESC LIMIT 100",
        )
        .all((await autenticar(req)).sub);
    },
    async salvar(req, body) {
      const uid = (await autenticar(req)).sub;
      if (
        !Number.isSafeInteger(body.renda_centavos) ||
        body.renda_centavos < 1 ||
        body.renda_centavos > 100000000000
      )
        throw erro(400, "Renda inválida.");
      const r = await db
        .prepare(
          "INSERT INTO simulacoes(usuario_id,renda_centavos) VALUES(?,?)",
        )
        .run(uid, body.renda_centavos);
      return {
        id: Number(r.lastInsertRowid),
        renda_centavos: body.renda_centavos,
      };
    },
    async excluir(req, id) {
      const r = await db
        .prepare("DELETE FROM simulacoes WHERE id=? AND usuario_id=?")
        .run(id, (await autenticar(req)).sub);
      if (!r.changes) throw erro(404, "Simulação não encontrada.");
    },
  };
}
