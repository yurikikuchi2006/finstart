import { api } from "./api.js";
const $ = (id) => document.getElementById(id),
  moeda = (valor) =>
    (valor / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
let renda;
function calcular(event) {
  event.preventDefault();
  const valor = Number($("receita").value);
  renda = Math.round(valor * 100);
  if (!Number.isFinite(valor) || renda < 1 || renda > 100000000000) {
    $("resultado").style.display = "none";
    $("status").textContent = "Informe uma renda entre R$ 0,01 e R$ 1 bilhão.";
    renda = undefined;
    return;
  }
  const n = Math.round(renda * 0.5),
    d = Math.round(renda * 0.3);
  $("necessidades").textContent = moeda(n);
  $("desejos").textContent = moeda(d);
  const reservado = renda - n - d;
  $("poupanca").textContent = moeda(reservado);
  $("projetar-aporte").href = "juros.html#aporte=" + reservado;
  $("projetar-aporte").hidden = reservado <= 0;
  $("resultado").style.display = "block";
  $("salvar").disabled = false;
  $("status").textContent =
    "Simulação calculada. Você pode salvar na sua conta.";
  $("resultado-titulo").focus();
}
$("orcamento").addEventListener("submit", calcular);
$("receita").addEventListener("input", () => {
  renda = undefined;
  $("salvar").disabled = true;
  $("resultado").style.display = "none";
});
async function historico() {
  const lista = $("historico");
  lista.replaceChildren();
  try {
    const rows = await api("simulacoes");
    $("status-historico").textContent = rows.length
      ? "Últimas 100 simulações:"
      : "Nenhuma simulação salva.";
    for (const row of rows) {
      const li = document.createElement("li"),
        button = document.createElement("button");
      li.textContent =
        moeda(row.renda_centavos) +
        " — " +
        new Date(row.criado_em.replace(" ", "T") + "Z").toLocaleString(
          "pt-BR",
          { timeZone: "America/Sao_Paulo" },
        ) +
        " ";
      button.textContent = "Excluir";
      button.addEventListener("click", async () => {
        try {
          await api("simulacoes/" + row.id, "DELETE");
          await historico();
        } catch (e) {
          $("status").textContent = e.message;
        }
      });
      li.append(button);
      lista.append(li);
    }
  } catch (e) {
    $("status-historico").textContent =
      e.message + " Acesse Meu painel para entrar.";
  }
}
$("salvar").addEventListener("click", async () => {
  if (!renda) return;
  $("salvar").disabled = true;
  try {
    await api("simulacoes", "POST", { renda_centavos: renda });
    $("status").textContent = "Simulação salva.";
    await historico();
  } catch (e) {
    $("status").textContent = e.message;
    $("salvar").disabled = false;
  }
});
historico();
