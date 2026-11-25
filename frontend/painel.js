import { api } from "./api.js";
import { $, moeda, card } from "./ui.js";
function indicador(rotulo, valor) {
  const grupo = document.createElement("div");
  const termo = document.createElement("dt");
  const numero = document.createElement("dd");
  termo.textContent = rotulo;
  numero.textContent = valor;
  grupo.append(termo, numero);
  return grupo;
}
function estadoVazio(titulo, texto, rotulo, href) {
  const aviso = card(titulo, texto);
  const link = document.createElement("a");
  link.href = href;
  link.textContent = rotulo;
  aviso.append(link);
  return aviso;
}
export async function carregarPainel() {
  $("painel-status").textContent = "Carregando seus dados…";
  try {
    const [metas, orcamentos, juros, comparacoes] = await Promise.all([
      api("metas"),
      api("simulacoes"),
      api("juros"),
      api("comparacoes"),
    ]);
    const total = metas.reduce((s, m) => s + m.guardado_centavos, 0);
    $("indicadores").replaceChildren(
      indicador(
        "Metas ativas",
        String(
          metas.filter((m) => m.guardado_centavos < m.alvo_centavos).length,
        ),
      ),
      indicador("Guardado nas metas", moeda(total)),
      indicador(
        "Simulações no histórico",
        String(
          orcamentos.length +
            juros.length +
            new Set(comparacoes.map((c) => c.juros_id)).size,
        ),
      ),
    );
    $("painel-metas").replaceChildren();
    for (const m of metas.slice(0, 4)) {
      const meta = card(
        m.titulo,
        `${moeda(m.guardado_centavos)} de ${moeda(m.alvo_centavos)} · ${Math.round((100 * m.guardado_centavos) / m.alvo_centavos)}%`,
      );
      const progresso = document.createElement("progress");
      progresso.max = m.alvo_centavos;
      progresso.value = m.guardado_centavos;
      progresso.setAttribute("aria-label", "Progresso de " + m.titulo);
      meta.append(progresso);
      $("painel-metas").append(meta);
    }
    if (!metas.length)
      $("painel-metas").append(
        estadoVazio(
          "Qual é seu próximo objetivo?",
          "Defina um valor e acompanhe quanto já conseguiu guardar.",
          "Criar primeira meta",
          "metas.html",
        ),
      );
    $("painel-simulacoes").replaceChildren();
    const recentes = [
      ...orcamentos.map((r) => ({
        ...r,
        tipo: "Orçamento",
        texto: "Renda mensal: " + moeda(r.renda_centavos),
      })),
      ...juros.map((r) => ({
        ...r,
        tipo: "Juros compostos",
        texto: moeda(r.saldo_centavos) + " em " + r.meses + " meses",
      })),
    ]
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em) || b.id - a.id)
      .slice(0, 4);
    for (const r of recentes) {
      const data = new Date(r.criado_em.replace(" ", "T") + "Z").toLocaleString(
        "pt-BR",
        { timeZone: "America/Sao_Paulo" },
      );
      $("painel-simulacoes").append(card(r.tipo, r.texto + " · " + data));
    }
    if (!recentes.length)
      $("painel-simulacoes").append(
        estadoVazio(
          "Nenhuma simulação salva",
          "Suas simulações salvas aparecerão aqui.",
          "Começar meu orçamento",
          "simulador.html",
        ),
      );
    $("painel-status").textContent =
      "Resumo da sua conta. As contagens de simulações consideram até 100 registros por ferramenta.";
  } catch (e) {
    $("painel-status").textContent = e.message;
  }
}
