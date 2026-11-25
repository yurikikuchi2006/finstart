import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const script = readFileSync(new URL("../frontend/ambiente.js", import.meta.url), "utf8");
test("Arquivo local bloqueia envio e desabilita campos", () => {
  const handlers = {},
    controls = [{}, {}],
    shown = [];
  const node = () => ({ style: {}, setAttribute() {}, append() {} });
  const doc = {
    readyState: "complete",
    addEventListener: (name, fn) => (handlers[name] = fn),
    querySelectorAll: () => controls,
    createElement: node,
    body: { append: (n) => shown.push(n) },
  };
  runInNewContext(script, {
    document: doc,
    location: {
      protocol: "file:",
      search: "",
      href: "file:///exemplo/conta.html",
    },
    history: {},
  });
  let prevented = false;
  handlers.submit({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.ok(controls.every((c) => c.disabled));
  assert.equal(shown.length, 1);
});
test("HTTP nao bloqueia cadastro normal e remove parametros de senha da URL", () => {
  let cleaned;
  const handlers = {};
  runInNewContext(script, {
    document: { addEventListener: (n, f) => (handlers[n] = f) },
    location: {
      protocol: "http:",
      search: "?senha=dado-ficticio",
      href: "http://localhost/conta.html?senha=dado-ficticio",
    },
    history: {
      replaceState(a, b, url) {
        cleaned = url;
      },
    },
  });
  assert.equal(cleaned, "http://localhost/conta.html");
  let prevented = false;
  handlers.submit({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, false);
});
test("Formularios de credenciais usam POST e protecao classica antes dos modulos", () => {
  const html = readFileSync(new URL("../frontend/conta.html", import.meta.url), "utf8");
  assert.match(html, /<form id="login" method="post" action="\/api\/login">/);
  assert.match(
    html,
    /<form id="cadastro" method="post" action="\/api\/cadastro">/,
  );
  assert.ok(html.indexOf('src="ambiente.js"') < html.indexOf('type="module"'));
});
