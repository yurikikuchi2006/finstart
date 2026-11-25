import { api } from "./api.js";
import { $, aviso } from "./ui.js";
const niveis = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};
let artigos = [];
function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR");
}
function mostrar() {
  const termo = normalizar($("busca").value.trim()),
    categoria = $("categoria").value,
    nivel = $("nivel").value;
  const lista = artigos.filter(
    (a) =>
      (!categoria || a.categoria === categoria) &&
      (!nivel || a.nivel === nivel) &&
      normalizar(a.titulo + " " + a.texto).includes(termo),
  );
  $("artigos").replaceChildren();
  for (const a of lista) {
    const article = document.createElement("article"),
      h = document.createElement("h2"),
      tag = document.createElement("p"),
      intro = document.createElement("p"),
      details = document.createElement("details"),
      summary = document.createElement("summary"),
      fontes = document.createElement("div");
    article.className = "card learning-card";
    h.textContent = a.titulo;
    tag.className = "eyebrow";
    tag.textContent = a.categoria + " · " + niveis[a.nivel];
    const textos = a.texto.split("\n").filter(Boolean);
    intro.textContent = textos[0];
    summary.textContent = "Continuar leitura";
    details.append(summary);
    for (const texto of textos.slice(1)) {
      const p = document.createElement("p");
      p.textContent = texto;
      details.append(p);
    }
    fontes.className = "article-sources";
    const label = document.createElement("p");
    label.textContent = "Fontes para aprofundar";
    fontes.append(label);
    for (const f of a.fontes) {
      const p = document.createElement("p"),
        link = document.createElement("a");
      link.textContent = f.titulo;
      link.href = f.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", f.titulo + " (abre em outra aba)");
      p.append(link);
      fontes.append(p);
    }
    const revisao = document.createElement("small");
    revisao.textContent =
      "Resumo da FinStart · fontes consultadas em 28/10/2026";
    fontes.append(revisao);
    article.append(tag, h, intro, details, fontes);
    $("artigos").append(article);
  }
  aviso(
    "status",
    `${lista.length} de ${artigos.length} conteúdos encontrados.`,
  );
  $("vazio").hidden = lista.length > 0;
}
try {
  artigos = await api("conteudos");
  for (const nome of [...new Set(artigos.map((a) => a.categoria))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  )) {
    const o = document.createElement("option");
    o.value = nome;
    o.textContent = nome;
    $("categoria").append(o);
  }
  try {
    const categoria = sessionStorage.getItem("finstart:categoria:v1");
    if ([...$("categoria").options].some((o) => o.value === categoria))
      $("categoria").value = categoria;
    $("nivel").value = sessionStorage.getItem("finstart:nivel:v1") || "";
  } catch {}
  mostrar();
} catch (e) {
  aviso("status", e);
}
$("busca").addEventListener("input", mostrar);
for (const id of ["categoria", "nivel"])
  $(id).addEventListener("change", () => {
    mostrar();
    try {
      sessionStorage.setItem("finstart:" + id + ":v1", $(id).value);
    } catch {}
  });
$("limpar-filtros").addEventListener("click", () => {
  for (const id of ["busca", "categoria", "nivel"]) $(id).value = "";
  try {
    sessionStorage.removeItem("finstart:categoria:v1");
    sessionStorage.removeItem("finstart:nivel:v1");
  } catch {}
  mostrar();
  $("busca").focus();
});
