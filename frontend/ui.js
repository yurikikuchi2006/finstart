export const moeda = (n) =>
  (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const $ = (id) => document.getElementById(id);
export function card(titulo, texto) {
  const el = document.createElement("article");
  el.className = "card";
  const h = document.createElement("h3"),
    p = document.createElement("p");
  h.textContent = titulo;
  p.textContent = texto;
  el.append(h, p);
  return el;
}
export function aviso(id, e) {
  $(id).textContent = e.message || e;
}
