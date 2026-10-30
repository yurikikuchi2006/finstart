export function configurarEmail(env = process.env, request = fetch) {
  if (env.EMAIL_OTP_ENABLED !== "true") return null;
  const sender = env.EMAIL_FROM?.trim();
  const key = env.BREVO_API_KEY?.trim();
  if (!key || !sender || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender))
    throw Error(
      "Verificação por e-mail exige BREVO_API_KEY e EMAIL_FROM nas variáveis privadas.",
    );
  return {
    async sendCode({ email, code, purpose }) {
      let response;
      try {
        response = await request("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": key,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "FinStart", email: sender },
            to: [{ email }],
            subject:
              purpose === "cadastro"
                ? "Confirme seu e-mail na FinStart"
                : "Seu código de acesso à FinStart",
            textContent: `Seu código da FinStart é ${code}. Ele expira em 10 minutos e só pode ser usado uma vez.\n\nNão compartilhe este código. Se você não solicitou, ignore esta mensagem.`,
          }),
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw Object.assign(
          Error(
            "Não foi possível enviar o código agora. Aguarde um minuto e tente novamente.",
          ),
          { status: 503 },
        );
      }
      if (!response.ok)
        throw Object.assign(
          Error(
            "Não foi possível enviar o código agora. Aguarde um minuto e tente novamente.",
          ),
          { status: 503 },
        );
    },
  };
}
