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
  const linhas = [];
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
    linhas.push(row);
    th.scope = "row";
    th.textContent = p.rotulo;
    td.textContent = moeda(p.valor);
    tr.append(th, td);
    body.append(tr);
  }
  table.append(caption, head, body);
  wrap.append(table);
  figure.append(cap);
  if (pontos.length > 1) {
    const controles = document.createElement("div");
    const label = document.createElement("label");
    const seletor = document.createElement("select");
    const valor = document.createElement("output");
    controles.className = "chart-controles";
    label.textContent = "Explorar valores";
    seletor.setAttribute("aria-label", "Explorar valores de " + titulo.toLowerCase());
    for (const [i, ponto] of pontos.entries())
      seletor.add(new Option(ponto.rotulo, String(i)));
    seletor.value = String(pontos.length - 1);
    let selecionada;
    function destacar() {
      const indice = Number(seletor.value);
      selecionada?.classList.remove("chart-selecionado");
      selecionada = linhas[indice];
      selecionada.classList.add("chart-selecionado");
      valor.textContent = moeda(pontos[indice].valor);
    }
    seletor.addEventListener("change", destacar);
    destacar();
    label.append(seletor);
    controles.append(label, valor);
    figure.append(controles);
  }
  figure.append(bars, wrap);
  container.append(figure);
}
