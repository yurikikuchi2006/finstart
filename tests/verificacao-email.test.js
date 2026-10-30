import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { conectar } from "../server/database.js";
import { criarServidor } from "../server/index.js";
import { controllers } from "../server/controllers.js";
import { configurarEmail } from "../server/email.js";
import { verificacaoEmail } from "../server/verificacao-email.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const secret = "segredo-de-teste-email-com-mais-de-32-caracteres";
const body = {
  nome: "Conta de teste",
  email: "email@example.test",
  senha: "SenhaSegura123!",
};
async function fixture(fn, { failure = false } = {}) {
  const db = conectar(":memory:");
  let time = 1800000000;
  const outbox = [];
  const server = criarServidor({
    db,
    secret,
    emailVerification: {
      now: () => time,
      sendCode: async (item) => {
        if (failure) throw Error("erro privado do provedor");
        outbox.push(item);
      },
    },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  async function call(path, method = "GET", data, cookie) {
    const r = await fetch(base + "/api/" + path, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      status: r.status,
      data: r.status === 204 ? null : await r.json(),
      cookie: r.headers.get("set-cookie"),
    };
  }
  try {
    await fn({ db, outbox, call, advance: (n) => (time += n) });
  } finally {
    await new Promise((r) => server.close(r));
    db.close();
  }
}
test("E-mail: cadastro só existe após código, sessão protegida e uso único", () =>
  fixture(async ({ db, outbox, call }) => {
    assert.equal((await call("auth-config")).data.verificacao_email, true);
    const start = await call("cadastro", "POST", body);
    assert.equal(start.status, 202);
    assert.equal(start.cookie, null);
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM usuarios").get()).n,
      0,
    );
    assert.equal((await call("me")).status, 401);
    assert.equal(outbox.length, 1);
    const stored = await db.prepare("SELECT * FROM desafios_email").get();
    assert.equal(stored.codigo_hash.length, 64);
    assert.ok(!stored.senha_hash.includes(body.senha));
    assert.ok(!JSON.stringify(start.data).includes(outbox[0].code));
    const confirmation = {
      desafio_id: start.data.desafio_id,
      codigo: outbox[0].code,
    };
    const verified = await call("confirmar-email", "POST", confirmation);
    assert.equal(verified.status, 200);
    assert.match(verified.cookie, /HttpOnly/);
    const cookie = verified.cookie.split(";")[0];
    assert.equal(
      (await call("me", "GET", undefined, cookie)).data.email,
      body.email,
    );
    assert.equal(
      (await db.prepare("SELECT email_verificado_em FROM usuarios").get())
        .email_verificado_em,
      1800000000,
    );
    assert.equal(
      (await call("confirmar-email", "POST", confirmation)).status,
      400,
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM sessoes").get()).n,
      1,
    );
  }));
test("E-mail: senha válida não abre sessão; confirmação concorrente emite apenas uma", () =>
  fixture(async ({ db, outbox, call }) => {
    await controllers(db, secret).cadastrar(body);
    assert.equal(
      (await call("login", "POST", { ...body, senha: "incorreta" })).status,
      401,
    );
    assert.equal(outbox.length, 0);
    const start = await call("login", "POST", body);
    assert.equal(start.status, 202);
    assert.equal(start.cookie, null);
    assert.equal((await call("me")).status, 401);
    const data = { desafio_id: start.data.desafio_id, codigo: outbox[0].code };
    const results = await Promise.all([
      call("confirmar-email", "POST", data),
      call("confirmar-email", "POST", data),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    assert.equal(
      (await db.prepare("SELECT COUNT(*) n FROM sessoes").get()).n,
      1,
    );
  }));
test("E-mail: cinco erros bloqueiam o código e a expiração impede confirmação", () =>
  fixture(async ({ outbox, call, advance }) => {
    const start = await call("cadastro", "POST", body);
    const actual = outbox[0].code;
    const wrong = actual === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await call("confirmar-email", "POST", {
            desafio_id: start.data.desafio_id,
            codigo: wrong,
          })
        ).status,
        400,
      );
    assert.equal(
      (
        await call("confirmar-email", "POST", {
          desafio_id: start.data.desafio_id,
          codigo: actual,
        })
      ).status,
      400,
    );
    advance(601);
    assert.equal(
      (
        await call("confirmar-email", "POST", {
          desafio_id: start.data.desafio_id,
          codigo: actual,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("reenviar-codigo", "POST", {
          desafio_id: start.data.desafio_id,
        })
      ).status,
      400,
    );
  }));
test("E-mail: reenvio tem intervalo, invalida código anterior e limita destinatário", () =>
  fixture(async ({ outbox, call, advance }) => {
    const start = await call("cadastro", "POST", body);
    const old = outbox[0].code;
    assert.equal(
      (
        await call("reenviar-codigo", "POST", {
          desafio_id: start.data.desafio_id,
        })
      ).status,
      429,
    );
    advance(61);
    const resent = await call("reenviar-codigo", "POST", {
      desafio_id: start.data.desafio_id,
    });
    assert.equal(resent.status, 202);
    assert.equal(outbox.length, 2);
    assert.notEqual(outbox[1].code, old);
    assert.equal(
      (
        await call("confirmar-email", "POST", {
          desafio_id: start.data.desafio_id,
          codigo: old,
        })
      ).status,
      400,
    );
    for (let i = 0; i < 3; i++) {
      advance(61);
      assert.equal(
        (
          await call("reenviar-codigo", "POST", {
            desafio_id: start.data.desafio_id,
          })
        ).status,
        202,
      );
    }
    advance(61);
    assert.equal(
      (
        await call("reenviar-codigo", "POST", {
          desafio_id: start.data.desafio_id,
        })
      ).status,
      429,
    );
    assert.equal(outbox.length, 5);
  }));
test("E-mail: código correto sem erros prévios também expira após dez minutos", () =>
  fixture(async ({ outbox, call, advance }) => {
    const start = await call("cadastro", "POST", body);
    advance(600);
    assert.equal(
      (
        await call("confirmar-email", "POST", {
          desafio_id: start.data.desafio_id,
          codigo: outbox[0].code,
        })
      ).status,
      400,
    );
    assert.equal((await call("me")).status, 401);
  }));
test("E-mail: falha do provedor não cria conta, código utilizável ou sessão", () =>
  fixture(
    async ({ db, call }) => {
      const result = await call("cadastro", "POST", body);
      assert.equal(result.status, 503);
      assert.ok(!JSON.stringify(result).includes("erro privado"));
      for (const table of ["usuarios", "desafios_email", "sessoes"])
        assert.equal(
          (await db.prepare("SELECT COUNT(*) n FROM " + table).get()).n,
          0,
        );
    },
    { failure: true },
  ));
test("E-mail: cota diária global impede envio antes de consumir o limite gratuito", () =>
  fixture(async ({ db, outbox, call }) => {
    const key = createHmac("sha256", secret)
      .update("global-email")
      .digest("hex");
    await db
      .prepare(
        "INSERT INTO email_limites(chave,janela,usados,proximo_envio) VALUES(?,?,?,?)",
      )
      .run(key, Math.floor(1800000000 / 86400) * 86400, 250, 0);
    assert.equal((await call("cadastro", "POST", body)).status, 429);
    assert.equal(outbox.length, 0);
  }));
test("Brevo: configuração privada obrigatória e envio HTTPS sem expor credenciais", async () => {
  assert.equal(configurarEmail({}), null);
  assert.throws(() => configurarEmail({ EMAIL_OTP_ENABLED: "true" }));
  let request;
  const service = configurarEmail(
    {
      EMAIL_OTP_ENABLED: "true",
      EMAIL_FROM: "finstart@example.test",
      BREVO_API_KEY: "chave-ficticia",
    },
    async (url, options) => {
      request = { url, options };
      return { ok: true };
    },
  );
  await service.sendCode({
    email: "destino@example.test",
    code: "123456",
    purpose: "login",
  });
  assert.equal(request.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(request.options.headers["api-key"], "chave-ficticia");
  assert.match(JSON.parse(request.options.body).textContent, /123456/);
  const failure = configurarEmail(
    {
      EMAIL_OTP_ENABLED: "true",
      EMAIL_FROM: "finstart@example.test",
      BREVO_API_KEY: "chave-ficticia",
    },
    async () => ({ ok: false }),
  );
  await assert.rejects(
    () =>
      failure.sendCode({
        email: "destino@example.test",
        code: "123456",
        purpose: "login",
      }),
    (e) => e.status === 503 && !e.message.includes("chave-ficticia"),
  );
});
test("E-mail: desafio persiste ao reabrir o banco e rejeita identificador inexistente", async () => {
  const dir = await mkdtemp(join(tmpdir(), "finstart-email-"));
  const path = join(dir, "teste.sqlite");
  let db = conectar(path);
  const outbox = [];
  try {
    let c = controllers(db, secret);
    let flow = verificacaoEmail(db, secret, c, {
      sendCode: async (item) => outbox.push(item),
    });
    const first = await flow.iniciarCadastro(body);
    await flow.iniciarCadastro({ ...body, email: "outra@example.test" });
    await assert.rejects(
      () =>
        flow.confirmar({ desafio_id: "0".repeat(64), codigo: outbox[0].code }),
      (e) => e.status === 400,
    );
    db.close();
    db = conectar(path);
    c = controllers(db, secret);
    flow = verificacaoEmail(db, secret, c, {
      sendCode: async () => {
        throw Error("Não deve reenviar");
      },
    });
    assert.equal(
      (
        await flow.confirmar({
          desafio_id: first.desafio_id,
          codigo: outbox[0].code,
        })
      ).usuario.email,
      body.email,
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) n FROM usuarios").get()).n,
      1,
    );
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
