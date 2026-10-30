import { conectarMySQL } from "./mysql.js";
import express from "express";
import { semear } from "./seed.js";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
import { conectar } from "./database.js";
import { controllers } from "./controllers.js";
import { configurarEmail } from "./email.js";
import { verificacaoEmail } from "./verificacao-email.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const publicos = new Set([
  "aprender.html",
  "aprender.js",
  "comparar.html",
  "comparar.js",
  "dominio.js",
  "graficos.js",
  "ambiente.js",
  "shell.js",
  "juros.html",
  "juros.js",
  "metas.html",
  "metas.js",
  "painel.js",
  "financas.js",
  "ui.js",
  "index.html",
  "projeto.html",
  "simulador.html",
  "conta.html",
  "conta.js",
  "simulador.js",
  "api.js",
  "style.css",
  "logo_FinStart.png",
]);
export function criarServidor({
  db,
  secret,
  secure = false,
  publicOrigin,
  emailVerification = null,
}) {
  if (
    publicOrigin &&
    (new URL(publicOrigin).origin !== publicOrigin ||
      (secure && !publicOrigin.startsWith("https://")))
  )
    throw Error(
      "PUBLIC_ORIGIN deve ser a origem exata do site, sem barra final e com HTTPS em produção.",
    );
  if (!secret || secret.length < 32)
    throw Error("Defina JWT_SECRET com pelo menos 32 caracteres.");
  const c = controllers(db, secret);
  const email = emailVerification
    ? verificacaoEmail(db, secret, c, emailVerification)
    : null;
  const tentativas = new Map();
  const ready = semear(db);
  const app = express();
  app.disable("x-powered-by");
  app.use(async (req, res) => {
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    };
    function enviar(status, data, extra = {}) {
      res.writeHead(status, { ...headers, ...extra });
      res.end(data === undefined ? undefined : JSON.stringify(data));
    }
    const cookie = (token) =>
      `finstart=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 3600 : 0}${secure ? "; Secure" : ""}`;
    try {
      await ready;
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) {
        if (
          !["GET", "HEAD"].includes(req.method) &&
          req.headers.origin &&
          req.headers.origin !==
            (publicOrigin || `http${secure ? "s" : ""}://${req.headers.host}`)
        )
          return enviar(403, { erro: "Origem não permitida." });
        let body = {};
        if (
          ["POST", "PUT"].includes(req.method) &&
          url.pathname !== "/api/logout"
        ) {
          if (!req.headers["content-type"]?.startsWith("application/json"))
            return enviar(415, { erro: "Envie JSON." });
          const chunks = [];
          let tamanho = 0;
          for await (const chunk of req) {
            tamanho += chunk.length;
            if (tamanho > 16384)
              throw Object.assign(Error("Requisição muito grande."), {
                status: 413,
              });
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString("utf8");
          try {
            body = JSON.parse(raw);
          } catch {
            return enviar(400, { erro: "JSON inválido." });
          }
          if (!body || typeof body !== "object" || Array.isArray(body))
            return enviar(400, { erro: "Envie um objeto JSON." });
        }
        const route = req.method + " " + url.pathname;
        if (
          [
            "POST /api/login",
            "POST /api/cadastro",
            "POST /api/confirmar-email",
            "POST /api/reenviar-codigo",
          ].includes(route)
        ) {
          const now = Date.now(),
            key = req.socket.remoteAddress;
          for (const [ip, item] of tentativas)
            if (item.until < now) tentativas.delete(ip);
          const item = tentativas.get(key) || { count: 0, until: now + 60000 };
          tentativas.set(key, item);
          if (++item.count > 20)
            return enviar(429, {
              erro: "Muitas tentativas. Aguarde um minuto.",
            });
        }
        if (route === "GET /api/saude") {
          await db.prepare("SELECT 1").get();
          return enviar(200, { status: "ok", banco: "conectado" });
        }
        if (route === "GET /api/auth-config")
          return enviar(200, { verificacao_email: Boolean(email) });
        if (email && route === "POST /api/reenviar-codigo")
          return enviar(202, await email.reenviar(body));
        if (email && route === "POST /api/confirmar-email") {
          const r = await email.confirmar(body);
          return enviar(200, r.usuario, { "Set-Cookie": cookie(r.token) });
        }
        if (route === "GET /api/conteudos")
          return enviar(200, await c.conteudos());
        if (route === "GET /api/tipos") return enviar(200, await c.tipos());
        if (route === "POST /api/calcular")
          return enviar(200, await c.calcular(body));
        if (route === "POST /api/comparar")
          return enviar(200, await c.comparar(body));
        if (route === "POST /api/comparacoes")
          return enviar(201, await c.salvarComparacao(req, body));
        if (route === "GET /api/comparacoes")
          return enviar(200, await c.comparacoes(req));
        if (
          req.method === "GET" &&
          /^\/api\/metas\/\d+\/progresso$/.test(url.pathname)
        )
          return enviar(
            200,
            await c.progresso(req, Number(url.pathname.split("/")[3])),
          );
        if (route === "POST /api/cadastro")
          return email
            ? enviar(202, await email.iniciarCadastro(body))
            : enviar(201, await c.cadastrar(body));
        if (route === "POST /api/login") {
          if (email) return enviar(202, await email.iniciarLogin(body));
          const r = await c.login(body);
          return enviar(200, r.usuario, { "Set-Cookie": cookie(r.token) });
        }
        if (route === "GET /api/metas") return enviar(200, await c.metas(req));
        if (route === "POST /api/metas")
          return enviar(201, await c.criarMeta(req, body));
        if (/^\/api\/metas\/\d+$/.test(url.pathname)) {
          const id = Number(url.pathname.split("/").at(-1));
          if (req.method === "PUT") {
            await c.atualizarMeta(req, id, body);
            return enviar(204);
          }
          if (req.method === "DELETE") {
            await c.excluirMeta(req, id);
            return enviar(204);
          }
        }
        if (route === "GET /api/juros") return enviar(200, await c.juros(req));
        if (route === "POST /api/juros")
          return enviar(201, await c.salvarJuros(req, body));
        if (
          req.method === "DELETE" &&
          /^\/api\/juros\/\d+$/.test(url.pathname)
        ) {
          await c.excluirJuros(req, Number(url.pathname.split("/").at(-1)));
          return enviar(204);
        }
        if (route === "GET /api/me") return enviar(200, await c.me(req));
        if (route === "POST /api/logout") {
          await c.logout(req);
          return enviar(204, undefined, { "Set-Cookie": cookie("") });
        }
        if (route === "GET /api/simulacoes")
          return enviar(200, await c.listar(req));
        if (route === "POST /api/simulacoes")
          return enviar(201, await c.salvar(req, body));
        if (
          req.method === "DELETE" &&
          /^\/api\/simulacoes\/\d+$/.test(url.pathname)
        ) {
          await c.excluir(req, Number(url.pathname.split("/").at(-1)));
          return enviar(204);
        }
        return enviar(404, { erro: "Endpoint não encontrado." });
      }
      const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      if (!["GET", "HEAD"].includes(req.method) || !publicos.has(name))
        return enviar(404, { erro: "Página não encontrada." });
      const content = await readFile(resolve(root, name));
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".png": "image/png",
      };
      res.writeHead(200, { ...headers, "Content-Type": types[extname(name)] });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (e) {
      if (!e.status) console.error(e);
      enviar(e.status || 500, {
        erro: e.status ? e.message : "Erro interno do servidor.",
      });
    }
  });
  return createServer(app);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DB_DRIVER !== "mysql"
  )
    throw Error(
      "Produção exige DB_DRIVER=mysql e banco persistente configurado.",
    );
  const db =
    process.env.DB_DRIVER === "mysql"
      ? await conectarMySQL()
      : conectar(process.env.DB_PATH || resolve(root, "data/finstart.sqlite"));
  criarServidor({
    db,
    secret: process.env.JWT_SECRET,
    secure: process.env.NODE_ENV === "production",
    publicOrigin: process.env.PUBLIC_ORIGIN,
    emailVerification: configurarEmail(),
  })
    .listen(
      Number(process.env.PORT || 3000),
      process.env.HOST ||
        (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
      () =>
        console.log(
          "FinStart: servidor iniciado na porta " + (process.env.PORT || 3000),
        ),
    )
    .on("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? "A porta já está em uso. Encerre a instância anterior da FinStart ou altere PORT no .env."
          : error.message,
      );
      db.close();
      process.exitCode = 1;
    });
}
