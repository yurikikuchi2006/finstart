import test from "node:test";
import assert from "node:assert/strict";
import { conectarMySQL } from "../server/mysql.js";
import { criarServidor } from "../server/index.js";
test(
  "MySQL real: API, persistência, relacionamentos e transações",
  { skip: process.env.FINSTART_TEST_MYSQL !== "1" },
  async () => {
    let db = await conectarMySQL();
    let server = criarServidor({
      db,
      secret: "segredo-de-teste-mysql-com-32-caracteres",
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    let base = "http://127.0.0.1:" + server.address().port;
    let cookie = "",
      uid;
    async function call(p, method = "GET", body) {
      const r = await fetch(base + "/api/" + p, {
        method,
        headers: { "Content-Type": "application/json", cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {
        status: r.status,
        data: r.status === 204 ? null : await r.json(),
        cookie: r.headers.get("set-cookie")?.split(";")[0],
      };
    }
    try {
      assert.equal((await call("saude")).status, 200);
      assert.equal((await call("conteudos")).data.length, 15);
      const conta = {
        nome: "Validação MySQL",
        email: `mysql-${Date.now()}@example.test`,
        senha: "TesteMysql123",
      };
      const cadastro = await call("cadastro", "POST", conta);
      assert.equal(cadastro.status, 201);
      uid = cadastro.data.id;
      cookie = (await call("login", "POST", conta)).cookie;
      const m = await call("metas", "POST", {
        titulo: "Minha reserva SQL",
        alvo_centavos: 120000,
        prazo_meses: 12,
      });
      assert.equal(m.status, 201);
      assert.equal(
        (await call("metas/" + m.data.id, "PUT", { guardado_centavos: 24000 }))
          .status,
        204,
      );
      assert.equal((await call("metas")).data[0].aporte_centavos, 8000);
      assert.equal(
        (await call("metas/" + m.data.id + "/progresso")).data.length,
        1,
      );
      const j = await call("juros", "POST", {
        inicial_centavos: 100000,
        aporte_centavos: 20000,
        taxa: 0.5,
        meses: 24,
      });
      assert.equal(j.status, 201);
      assert.equal((await call("juros")).data[0].saldo_centavos, 621355);
      assert.equal(
        (await call("simulacoes", "POST", { renda_centavos: 300000 })).status,
        201,
      );
      const c = await call("comparacoes", "POST", {
        inicial_centavos: 100000,
        aporte_centavos: 20000,
        meses: 24,
      });
      assert.equal(c.status, 201);
      assert.equal((await call("comparacoes")).data.length, 3);
      await new Promise((r) => server.close(r));
      await db.close();
      db = await conectarMySQL();
      server = criarServidor({
        db,
        secret: "segredo-de-teste-mysql-com-32-caracteres",
      });
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      base = "http://127.0.0.1:" + server.address().port;
      assert.equal((await call("metas")).data[0].guardado_centavos, 24000);
      await assert.rejects(() =>
        db.transaction(async (tx) => {
          await tx
            .prepare("UPDATE metas SET titulo=? WHERE id=?")
            .run("Deve reverter", m.data.id);
          throw Error("rollback teste");
        }),
      );
      assert.equal((await call("metas")).data[0].titulo, "Minha reserva SQL");
      assert.equal((await call("juros/" + c.data.id, "DELETE")).status, 204);
      assert.equal((await call("comparacoes")).data.length, 0);
      assert.equal((await call("metas/" + m.data.id, "DELETE")).status, 204);
      assert.equal(
        (
          await db
            .prepare("SELECT count(*) n FROM progresso_meta WHERE meta_id=?")
            .get(m.data.id)
        ).n,
        0,
      );
      const fk = await db
        .prepare(
          "SELECT count(*) n FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE()",
        )
        .get();
      assert.ok(fk.n >= 8);
      console.log(
        "MySQL: esquema relacional, " +
          fk.n +
          " relacionamentos, persistência e rollback comprovados.",
      );
    } finally {
      if (uid) await db.prepare("DELETE FROM usuarios WHERE id=?").run(uid);
      await new Promise((r) => server.close(r));
      await db.close();
    }
  },
);
