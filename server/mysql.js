import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
function adapter(connection, pool) {
  return {
    prepare(sql) {
      return {
        async get(...params) {
          const [rows] = await connection.execute(sql, params);
          return rows[0];
        },
        async all(...params) {
          const [rows] = await connection.execute(sql, params);
          return rows;
        },
        async run(...params) {
          const [r] = await connection.execute(sql, params);
          return { changes: r.affectedRows, lastInsertRowid: r.insertId };
        },
      };
    },
    async transaction(fn) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(adapter(conn, pool));
        await conn.commit();
        return result;
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
export async function conectarMySQL() {
  const {
    DB_HOST = "127.0.0.1",
    DB_PORT = "3306",
    DB_USER,
    DB_PASSWORD,
    DB_NAME = "finstart",
  } = process.env;
  if (!DB_USER) throw Error("Configure DB_USER e o acesso MySQL no .env.");
  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD || "",
    database: DB_NAME,
    decimalNumbers: true,
    dateStrings: true,
    connectionLimit: 5,
    timezone: "Z",
    ...(process.env.DB_SSL === "true"
      ? {
          ssl: {
            rejectUnauthorized: true,
            ...(process.env.DB_SSL_CA
              ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") }
              : {}),
          },
        }
      : {}),
  });
  pool.on("connection", (connection) =>
    connection.query("SET time_zone = '+00:00'"),
  );
  try {
    const sql = readFileSync(
      new URL("../database/schema.mysql.sql", import.meta.url),
      "utf8",
    );
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await pool.query(statement);
    const [emailFields] = await pool.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuarios' AND COLUMN_NAME='email_verificado_em'",
    );
    if (!emailFields.length)
      await pool.query(
        "ALTER TABLE usuarios ADD COLUMN email_verificado_em BIGINT NULL",
      );
    const [contentFields] = await pool.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='conteudo' AND COLUMN_NAME='fontes_json'",
    );
    if (!contentFields.length)
      await pool.query(
        "ALTER TABLE conteudo ADD COLUMN fontes_json LONGTEXT NOT NULL DEFAULT ('[]')",
      );
    await pool.query(
      "UPDATE metas SET data_inicio=DATE(criado_em) WHERE data_inicio IS NULL",
    );
    await pool.query(
      "UPDATE metas SET status=CASE WHEN guardado_centavos>=alvo_centavos THEN 'concluida' ELSE 'em_andamento' END",
    );
    return adapter(pool, pool);
  } catch (e) {
    await pool.end();
    throw e;
  }
}
