export function projetar({ inicial_centavos, aporte_centavos, taxa, meses }) {
  if (
    ![inicial_centavos, aporte_centavos].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000000,
    ) ||
    typeof taxa !== "number" ||
    !Number.isFinite(taxa) ||
    taxa < 0 ||
    taxa > 10 ||
    !Number.isInteger(meses) ||
    meses < 1 ||
    meses > 600
  )
    throw Object.assign(
      Error(
        "Informe valores até R$ 1 bilhão, taxa mensal de 0 a 10% e prazo de 1 a 600 meses.",
      ),
      { status: 400 },
    );
  let saldo = inicial_centavos;
  const pontos = [];
  for (let mes = 1; mes <= meses; mes++) {
    saldo = saldo * (1 + taxa / 100) + aporte_centavos;
    pontos.push({ mes, saldo_centavos: Math.round(saldo) });
  }
  if (!Number.isSafeInteger(Math.round(saldo)))
    throw Object.assign(
      Error("Projeção muito alta. Reduza a taxa, o valor ou o prazo."),
      { status: 400 },
    );
  const investido = inicial_centavos + aporte_centavos * meses;
  return {
    saldo_centavos: Math.round(saldo),
    investido_centavos: investido,
    juros_centavos: Math.round(saldo) - investido,
    pontos,
  };
}
