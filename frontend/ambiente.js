(function () {
  "use strict";
  // This non-module script also runs when someone opens an HTML file directly.
  if (location.search && /(?:^|[?&])(senha|password)=/i.test(location.search)) {
    try {
      history.replaceState(null, "", location.href.split("?")[0].split("#")[0]);
    } catch (_) {
      location.replace(location.href.split("?")[0].split("#")[0]);
    }
  }
  document.addEventListener(
    "submit",
    function (event) {
      if (location.protocol === "file:") event.preventDefault();
    },
    true,
  );
  if (location.protocol !== "file:") return;
  function orientar() {
    document
      .querySelectorAll("input,select,textarea,button")
      .forEach(function (el) {
        el.disabled = true;
      });
    var aviso = document.createElement("section");
    aviso.setAttribute("role", "alert");
    aviso.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:#101010f5;display:grid;place-content:center;padding:28px;color:#eee6d2;font:17px/1.6 Segoe UI,sans-serif;";
    var titulo = document.createElement("h1");
    titulo.textContent = "Vamos iniciar a FinStart corretamente.";
    titulo.style.cssText =
      "font-size:32px;max-width:650px;color:#e2bd48;line-height:1.2;margin-bottom:22px;";
    var texto = document.createElement("p");
    texto.textContent =
      "Esta página foi aberta como arquivo. Para usar cadastro, cálculos e banco de dados, feche esta aba e dê dois cliques em INICIAR-FINSTART.cmd na pasta do projeto.";
    texto.style.maxWidth = "650px";
    var link = document.createElement("a");
    link.href = "http://127.0.0.1:3000/";
    link.textContent = "Abrir a FinStart pelo servidor";
    link.style.cssText = "display:block;color:#e2bd48;margin-top:24px;";
    var ajuda = document.createElement("p");
    ajuda.textContent =
      "Se o servidor já estiver ativo, o link acima abre o sistema. Os formulários desta cópia foram bloqueados para evitar envio de dados pela URL.";
    ajuda.style.cssText =
      "max-width:650px;font-size:14px;margin-top:22px;color:#b5ad99;";
    aviso.append(titulo, texto, link, ajuda);
    document.body.append(aviso);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", orientar);
  else orientar();
})();
