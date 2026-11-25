import { tabelaGrafico } from "./graficos.js";
import { api } from "./api.js";
import { projetar } from "./financas.js";
import { $, moeda, card, aviso } from "./ui.js";
let dados;
const aporte = Number(new URLSearchParams(location.hash.slice(1)).get("aporte"));
if (Number.isInteger(aporte) && aporte > 0 && aporte <= 100000000000) {
  $("aporte").value = (aporte / 100).toFixed(2);
  aviso("status", "Aporte mensal preenchido com o valor reservado no orçamento.");
}
async function listar() {
  try {
    const rows = await api("juros");
    $("historico").replaceChildren();
    $("historico-status").textContent = rows.length
      ? "Últimas 100 projeções."
      : "Nenhuma projeção salva.";
    for (const r of rows) {
      const el = card(
          moeda(r.saldo_centavos),
          `${r.meses} meses · ${r.taxa}% ao mês · inicial ${moeda(r.inicial_centavos)} · aporte ${moeda(r.aporte_centavos)}`,
        ),
        b = document.createElement("button");
      b.textContent = "Excluir projeção";
      b.addEventListener("click", async () => {
        try {
          await api("juros/" + r.id, "DELETE");
          await listar();
        } catch (e) {
          aviso("status", e);
        }
      });
      el.append(b);
      $("historico").append(el);
    }
  } catch (e) {
    aviso(
      "historico-status",
      e.message + " Entre em Meu painel para salvar e consultar.",
    );
  }
}
$("juros-form").addEventListener("input", () => {
  dados = undefined;
  $("projecao").hidden = true;
});
$("juros-form").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    dados = {
      inicial_centavos: Math.round(Number($("inicial").value) * 100),
      aporte_centavos: Math.round(Number($("aporte").value) * 100),
      taxa: Number($("taxa").value),
      meses: Number($("meses").value),
    };
    const p = projetar(dados);
    const linkMeta = $("criar-meta-projecao");
    linkMeta.hidden = p.saldo_centavos < 1 || p.saldo_centavos > 100000000000;
    linkMeta.href = "metas.html#" + new URLSearchParams({
      alvo: p.saldo_centavos,
      prazo: dados.meses,
    });
    $("resumo").replaceChildren(
      card("Saldo projetado", moeda(p.saldo_centavos)),
      card("Total investido", moeda(p.investido_centavos)),
      card("Juros acumulados", moeda(p.juros_centavos)),
    );
    const passo = Math.max(1, Math.ceil(dados.meses / 12));
    tabelaGrafico(
      $("barras"),
      "Evolução do saldo projetado",
      p.pontos
        .filter((x) => x.mes % passo === 0 || x.mes === dados.meses)
        .map((x) => ({ rotulo: "Mês " + x.mes, valor: x.saldo_centavos })),
    );
    $("projecao").hidden = false;
    $("salvar").disabled = false;
    aviso("status", "Projeção calculada.");
    $("projecao-titulo").focus();
  } catch (err) {
    dados = undefined;
    $("projecao").hidden = true;
    aviso("status", err);
  }
});
$("salvar").addEventListener("click", async () => {
  if (!dados) return;
  $("salvar").disabled = true;
  try {
    await api("juros", "POST", dados);
    aviso("status", "Projeção salva.");
    await listar();
  } catch (e) {
    aviso("status", e);
    $("salvar").disabled = false;
  }
});
listar();
