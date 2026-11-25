import { projetar } from "./financas.js";
import { $, moeda } from "./ui.js";

const prazos = document.querySelector(".projecao-demo-prazos");
const grafico = $("demo-grafico");
const contexto = grafico.getContext("2d");
const movimentoReduzido = matchMedia("(prefers-reduced-motion: reduce)");
const aporteMensal = 60000;
const simular = (meses) => projetar({
  inicial_centavos: 0,
  aporte_centavos: aporteMensal,
  taxa: 0.5,
  meses,
});
const escala = simular(36).saldo_centavos;

function desenhar(pontos) {
  if (!contexto) return;
  const { width, height } = grafico;
  const margem = 12;
  const base = height - margem;
  const altura = height - 2 * margem;
  const fatores = pontos.map(({ saldo_centavos }, i) => [
    margem + ((width - 2 * margem) * i) / (pontos.length - 1),
    base - (altura * saldo_centavos) / escala,
  ]);
  contexto.clearRect(0, 0, width, height);
  contexto.beginPath();
  for (const [x, y] of fatores) contexto.lineTo(x, y);
  contexto.lineTo(fatores.at(-1)[0], base);
  contexto.lineTo(margem, base);
  contexto.closePath();
  const preenchimento = contexto.createLinearGradient(0, 0, 0, height);
  preenchimento.addColorStop(0, "#75e2bb68");
  preenchimento.addColorStop(1, "#75e2bb08");
  contexto.fillStyle = preenchimento;
  contexto.fill();
  contexto.beginPath();
  for (const [x, y] of fatores) contexto.lineTo(x, y);
  contexto.strokeStyle = "#91efd1";
  contexto.lineWidth = 4;
  contexto.lineJoin = "round";
  contexto.stroke();
  contexto.beginPath();
  for (const [i, [x]] of fatores.entries())
    contexto.lineTo(x, base - (altura * i * aporteMensal) / escala);
  contexto.setLineDash([8, 6]);
  contexto.strokeStyle = "#becfc9";
  contexto.lineWidth = 2;
  contexto.stroke();
  contexto.setLineDash([]);
  const [x, y] = fatores.at(-1);
  contexto.beginPath();
  contexto.arc(x, y, 7, 0, Math.PI * 2);
  contexto.fillStyle = "#aff5df";
  contexto.fill();
}

let entrada;
function mostrar(meses, animar) {
  const resultado = simular(meses);
  $("demo-saldo").textContent = moeda(resultado.saldo_centavos);
  $("demo-periodo").textContent = "em " + meses + " meses";
  $("demo-composicao").textContent =
    moeda(resultado.investido_centavos) + " em aportes · " +
    moeda(resultado.juros_centavos) + " em juros";
  $("demo-mes").textContent = "Mês " + meses;
  for (const botao of prazos.querySelectorAll("button"))
    botao.setAttribute("aria-pressed", String(Number(botao.value) === meses));
  desenhar([{ saldo_centavos: 0 }, ...resultado.pontos]);
  entrada?.cancel();
  if (animar && !movimentoReduzido.matches)
    entrada = grafico.animate(
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }],
      { duration: 250, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
}

mostrar(12, true);
prazos.hidden = false;
grafico.parentElement.hidden = !contexto;
movimentoReduzido.addEventListener("change", () => {
  if (movimentoReduzido.matches) entrada?.cancel();
});
prazos.addEventListener("click", (e) => {
  const botao = e.target.closest("button");
  if (!botao || botao.getAttribute("aria-pressed") === "true") return;
  mostrar(Number(botao.value), e.detail > 0);
});
