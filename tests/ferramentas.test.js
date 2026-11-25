import test from "node:test";
import assert from "node:assert/strict";
import { projetar } from "../frontend/financas.js";
import { conectar } from "../server/database.js";
import { controllers } from "../server/controllers.js";
test("Juros: zero, aportes no fim do mês e limites", () => {
  assert.equal(
    projetar({
      inicial_centavos: 10000,
      aporte_centavos: 1000,
      taxa: 0,
      meses: 12,
    }).saldo_centavos,
    22000,
  );
  assert.equal(
    projetar({
      inicial_centavos: 10000,
      aporte_centavos: 1000,
      taxa: 1,
      meses: 2,
    }).saldo_centavos,
    12211,
  );
  assert.throws(() =>
    projetar({ inicial_centavos: 0, aporte_centavos: 0, taxa: -1, meses: 12 }),
  );
  assert.throws(() =>
    projetar({
      inicial_centavos: 1e11,
      aporte_centavos: 1e11,
      taxa: 10,
      meses: 600,
    }),
  );
});
test("Metas e juros: propriedade, atualização, exclusão e dados inválidos", async () => {
  const db = conectar(":memory:");
  try {
    const c = controllers(db, "segredo-exclusivo-de-teste-com-32-caracteres");
    for (const email of ["a@teste.com", "b@teste.com"])
      await c.cadastrar({ nome: "Teste", email, senha: "Teste1234" });
    const req = async (email) => ({
        headers: {
          cookie:
            "finstart=" + (await c.login({ email, senha: "Teste1234" })).token,
        },
      }),
      a = await req("a@teste.com"),
      b = await req("b@teste.com");
    const meta = await c.criarMeta(a, {
      titulo: "Reserva",
      alvo_centavos: 10000,
    });
    await c.atualizarMeta(a, meta.id, { guardado_centavos: 5000 });
    assert.equal((await c.metas(a))[0].guardado_centavos, 5000);
    assert.equal((await c.metas(b)).length, 0);
    await assert.rejects(
      () => c.atualizarMeta(b, meta.id, { guardado_centavos: 1 }),
      { status: 404 },
    );
    await assert.rejects(() => c.excluirMeta(b, meta.id), { status: 404 });
    await assert.rejects(
      () => c.atualizarMeta(a, meta.id, { guardado_centavos: 10001 }),
      { status: 400 },
    );
    await assert.rejects(
      () => c.criarMeta(a, { titulo: "xx", alvo_centavos: 100 }),
      { status: 400 },
    );
    const j = await c.salvarJuros(a, {
      inicial_centavos: 10000,
      aporte_centavos: 1000,
      taxa: 1,
      meses: 2,
    });
    assert.equal((await c.juros(a))[0].saldo_centavos, 12211);
    assert.equal((await c.juros(b)).length, 0);
    await assert.rejects(() => c.excluirJuros(b, j.id), { status: 404 });
    await c.excluirJuros(a, j.id);
    await c.excluirMeta(a, meta.id);
    assert.equal((await c.metas(a)).length, 0);
    assert.equal((await c.juros(a)).length, 0);
  } finally {
    db.close();
  }
});
