import { api } from "./api.js";
import { $, card, aviso } from "./ui.js";
import { tabelaGrafico } from "./graficos.js";
let dados;
async function historico() {
  try {
    const rows = await api("comparacoes");
    $("historico").replaceChildren();
    for (const [id, grupo] of Map.groupBy(rows, (r) => r.juros_id)) {
      const el = card("Comparação #" + id, grupo[0].meses + " meses"),
        det = document.createElement("div"),
        del = document.createElement("button");
      tabelaGrafico(
        det,
        "Saldos salvos",
        grupo.map((r) => ({
          rotulo: r.nome + " (" + r.taxa_anual_aplicada + "% a.a.)",
          valor: r.valor_final_centavos,
        })),
      );
      del.type = "button";
      del.textContent = "Excluir comparação";
      del.addEventListener("click", async () => {
        if (!confirm("Excluir esta comparação salva?")) return;
        try {
          await api("juros/" + id, "DELETE");
          await historico();
        } catch (e) {
          aviso("status", e);
        }
      });
      el.append(det, del);
      $("historico").append(el);
    }
    aviso(
      "historico-status",
      rows.length
        ? "Cenários salvos na sua conta."
        : "Nenhuma comparação salva.",
    );
  } catch (e) {
    aviso(
      "historico-status",
      e.message + " Entre no painel para guardar comparações.",
    );
  }
}
$("comparar-form").addEventListener("input", () => {
  dados = undefined;
  $("salvar").disabled = true;
  $("comparativo").hidden = true;
});
$("comparar-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    dados = {
      inicial_centavos: Math.round(Number($("inicial").value) * 100),
      aporte_centavos: Math.round(Number($("aporte").value) * 100),
      meses: Number($("meses").value),
    };
    const solicitacao = dados;
    const rows = await api("comparar", "POST", solicitacao);
    if (dados !== solicitacao) return;
    tabelaGrafico(
      $("grafico"),
      "Comparação dos saldos finais",
      rows.map((r) => ({
        rotulo: r.nome + " · " + r.taxa_anual_padrao + "% ao ano",
        valor: r.saldo_centavos,
      })),
    );
    $("comparativo").hidden = false;
    $("salvar").disabled = false;
    aviso(
      "status",
      "Calculado com taxas hipotéticas, constantes e aportes no fim do mês.",
    );
    $("comparativo-titulo").focus();
  } catch (err) {
    dados = undefined;
    aviso("status", err);
  } finally {
    b.disabled = false;
  }
});
$("salvar").addEventListener("click", async () => {
  if (!dados) return;
  $("salvar").disabled = true;
  try {
    await api("comparacoes", "POST", dados);
    aviso("status", "Comparação salva.");
    await historico();
  } catch (e) {
    aviso("status", e);
    $("salvar").disabled = false;
  }
});
historico();
