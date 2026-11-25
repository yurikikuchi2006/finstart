import { moeda } from "./ui.js";
export function tabelaGrafico(container, titulo, pontos) {
  container.replaceChildren();
  if (!pontos.length) {
    container.textContent = "Ainda não há registros.";
    return;
  }
  const figure = document.createElement("figure"),
    cap = document.createElement("figcaption"),
    bars = document.createElement("div"),
    wrap = document.createElement("div"),
    table = document.createElement("table"),
    caption = document.createElement("caption"),
    head = document.createElement("thead"),
    hr = document.createElement("tr"),
    body = document.createElement("tbody");
  cap.textContent = titulo;
  bars.className = "chart";
  bars.setAttribute("aria-hidden", "true");
  wrap.className = "table-wrap";
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-label", titulo);
  caption.textContent = "Valores de " + titulo.toLowerCase();
  for (const text of ["Registro", "Valor (R$)"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = text;
    hr.append(th);
  }
  head.append(hr);
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  for (const p of pontos) {
    const row = document.createElement("div"),
      bar = document.createElement("span"),
      tr = document.createElement("tr"),
      th = document.createElement("th"),
      td = document.createElement("td");
    row.className = "chart-row";
    row.textContent = p.rotulo + " · " + moeda(p.valor);
    bar.className = "barra";
    bar.style.width = Math.max(0, (100 * p.valor) / max) + "%";
    row.append(bar);
    bars.append(row);
    th.scope = "row";
    th.textContent = p.rotulo;
    td.textContent = moeda(p.valor);
    tr.append(th, td);
    body.append(tr);
  }
  table.append(caption, head, body);
  wrap.append(table);
  figure.append(cap, bars, wrap);
  container.append(figure);
}
