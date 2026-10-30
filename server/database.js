import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
export function conectar(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(
    readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  if (
    !db
      .prepare("PRAGMA table_info(usuarios)")
      .all()
      .some((f) => f.name === "email_verificado_em")
  )
    db.exec("ALTER TABLE usuarios ADD COLUMN email_verificado_em INTEGER");
  const contentFields = db
    .prepare("PRAGMA table_info(conteudo)")
    .all()
    .map((f) => f.name);
  if (!contentFields.includes("fontes_json"))
    db.exec(
      "ALTER TABLE conteudo ADD COLUMN fontes_json TEXT NOT NULL DEFAULT '[]'",
    );
  const fields = db
    .prepare("PRAGMA table_info(metas)")
    .all()
    .map((f) => f.name);
  if (!fields.includes("prazo_meses"))
    db.exec(
      "ALTER TABLE metas ADD COLUMN prazo_meses INTEGER CHECK(prazo_meses BETWEEN 1 AND 600)",
    );
  if (!fields.includes("data_inicio"))
    db.exec("ALTER TABLE metas ADD COLUMN data_inicio TEXT");
  if (!fields.includes("status"))
    db.exec(
      "ALTER TABLE metas ADD COLUMN status TEXT NOT NULL DEFAULT 'em_andamento'",
    );
  db.exec(
    "UPDATE metas SET data_inicio=substr(criado_em,1,10) WHERE data_inicio IS NULL",
  );
  db.exec(
    "INSERT INTO progresso_meta(meta_id,variacao_centavos,saldo_centavos) SELECT id,guardado_centavos,guardado_centavos FROM metas WHERE guardado_centavos>0 AND NOT EXISTS (SELECT 1 FROM progresso_meta p WHERE p.meta_id=metas.id)",
  );
  db.exec(
    "UPDATE metas SET status=CASE WHEN guardado_centavos>=alvo_centavos THEN 'concluida' ELSE 'em_andamento' END",
  );
  let fila = Promise.resolve();
  db.transaction = function (fn) {
    const operacao = fila.then(async () => {
      db.exec("BEGIN IMMEDIATE");
      try {
        const r = await fn(db);
        db.exec("COMMIT");
        return r;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    });
    fila = operacao.catch(() => {});
    return operacao;
  };
  return db;
}
