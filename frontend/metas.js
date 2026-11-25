import { api } from "./api.js";
import { $, moeda, card, aviso } from "./ui.js";
import { tabelaGrafico } from "./graficos.js";
const parametros = new URLSearchParams(location.hash.slice(1));
const alvo = Number(parametros.get("alvo"));
const prazo = Number(parametros.get("prazo"));
if (Number.isInteger(alvo) && alvo >= 1 && alvo <= 100000000000 &&
    Number.isInteger(prazo) && prazo >= 1 && prazo <= 600) {
  $("alvo").value = (alvo / 100).toFixed(2);
  $("prazo").value = String(prazo);
}
function campo(form, id, texto, value, props = {}) {
  const label = document.createElement("label"),
    input = document.createElement("input"),
    div = document.createElement("div");
  label.htmlFor = id;
  label.textContent = texto;
  Object.assign(input, { id, value, required: true, ...props });
  div.append(label, input);
  form.append(div);
  return input;
}
async function listar() {
  try {
    const rows = await api("metas");
    $("area").hidden = false;
    $("lista").replaceChildren();
    if (!rows.length)
      $("lista").append(
        card(
          "Seu próximo objetivo começa aqui",
          "Crie sua primeira meta no formulário acima.",
        ),
      );
    for (const r of rows) {
      const el = card(
          r.titulo,
          `${moeda(r.guardado_centavos)} de ${moeda(r.alvo_centavos)} · ${r.percentual}%`,
        ),
        progress = document.createElement("progress");
      const heading = el.querySelector("h3");
      heading.id = "meta-titulo-" + r.id;
      heading.tabIndex = -1;
      progress.max = r.alvo_centavos;
      progress.value = r.guardado_centavos;
      progress.setAttribute("aria-label", "Progresso de " + r.titulo);
      const estimativa = document.createElement("p");
      estimativa.textContent = r.prazo_meses
        ? `Prazo original: ${r.prazo_meses} meses · Para alcançar o objetivo: ${moeda(r.aporte_centavos)} por mês restante.`
        : "Defina um prazo para calcular o valor mensal necessário.";
      const details = document.createElement("details"),
        summary = document.createElement("summary"),
        form = document.createElement("form");
      summary.textContent = "Editar meta e registrar progresso";
      form.className = "grid";
      const titulo = campo(form, "titulo-" + r.id, "Nome da meta", r.titulo, {
          minLength: 3,
          maxLength: 80,
        }),
        alvo = campo(
          form,
          "alvo-" + r.id,
          "Objetivo (R$)",
          r.alvo_centavos / 100,
          { type: "number", min: "0.01", max: "1000000000", step: "0.01" },
        ),
        prazo = campo(
          form,
          "prazo-" + r.id,
          "Prazo total desde a criação (meses)",
          r.prazo_meses ?? 12,
          { type: "number", min: "1", max: "600", step: "1" },
        ),
        guardado = campo(
          form,
          "guardado-" + r.id,
          "Total já guardado (R$)",
          r.guardado_centavos / 100,
          { type: "number", min: "0", max: "1000000000", step: "0.01" },
        ),
        save = document.createElement("button");
      save.textContent = "Salvar alterações";
      form.append(save);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        save.disabled = true;
        try {
          await api("metas/" + r.id, "PUT", {
            titulo: titulo.value,
            alvo_centavos: Math.round(Number(alvo.value) * 100),
            prazo_meses: Number(prazo.value),
            guardado_centavos: Math.round(Number(guardado.value) * 100),
          });
          await listar();
          aviso("status", "Meta atualizada e progresso registrado.");
          $("meta-titulo-" + r.id)?.focus();
        } catch (err) {
          aviso("status", err);
          save.disabled = false;
        }
      });
      details.append(summary, form);
      const history = document.createElement("details"),
        hs = document.createElement("summary"),
        graph = document.createElement("div");
      hs.textContent = "Histórico e gráfico de progresso";
      history.append(hs, graph);
      history.addEventListener("toggle", async () => {
        if (!history.open) return;
        try {
          const pts = await api("metas/" + r.id + "/progresso");
          tabelaGrafico(
            graph,
            "Evolução do total guardado",
            pts.map((p, i) => ({
              rotulo: `${i + 1}. ${new Date(p.data_registro.replace(" ", "T") + "Z").toLocaleDateString("pt-BR")}`,
              valor: p.saldo_centavos,
            })),
          );
        } catch (e) {
          graph.textContent = e.message;
        }
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "secondary";
      del.textContent = "Excluir meta";
      del.addEventListener("click", async () => {
        if (!confirm("Excluir a meta e seu histórico de progresso?")) return;
        try {
          await api("metas/" + r.id, "DELETE");
          await listar();
          aviso("status", "Meta excluída.");
          $("titulo").focus();
        } catch (e) {
          aviso("status", e);
        }
      });
      el.append(progress, estimativa, details, history, del);
      $("lista").append(el);
    }
  } catch (e) {
    $("area").hidden = true;
    aviso("status", e);
  }
}
$("meta-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    const meta = await api("metas", "POST", {
      titulo: $("titulo").value,
      alvo_centavos: Math.round(Number($("alvo").value) * 100),
      prazo_meses: Number($("prazo").value),
    });
    e.target.reset();
    await listar();
    aviso("status", "Meta criada.");
    $("meta-titulo-" + meta.id)?.focus();
  } catch (err) {
    aviso("status", err);
  } finally {
    b.disabled = false;
  }
});
listar();
