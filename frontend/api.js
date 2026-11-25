export async function api(path, method = "GET", body, timeout = 90000) {
  const signal = AbortSignal.timeout(timeout);
  const indisponivel =
    "O serviço está iniciando ou temporariamente indisponível. Aguarde um momento e tente novamente.";
  let res;
  try {
    res = await fetch("/api/" + path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    if (signal.aborted) throw Error(indisponivel);
    throw Error(
      "O servidor pode estar iniciando. Aguarde um momento e consulte seu histórico antes de repetir uma operação de salvamento. Verifique também sua conexão.",
    );
  }
  let data = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch {
      const erro = Error(indisponivel);
      erro.status = res.status;
      throw erro;
    }
  }
  if (!res.ok) {
    const erro = Error(data?.erro || "Não foi possível concluir.");
    erro.status = res.status;
    throw erro;
  }
  return data;
}
