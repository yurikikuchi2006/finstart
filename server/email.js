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
      if (!/^\d{6}$/.test(code)) throw Error("Código de e-mail inválido.");
      const titulo =
        purpose === "cadastro" ? "Confirme seu e-mail" : "Confirme seu acesso";
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
            htmlContent: `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1e9;color:#222;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e0d8c2;border-radius:16px;">
<tr><td align="center" style="padding:28px;background:#111;border-radius:16px 16px 0 0;">
<img src="https://finstart-publicacao.vercel.app/logo_FinStart.png" width="88" height="88" alt="FinStart" style="display:block;border:0;border-radius:12px;">
<p style="margin:14px 0 0;color:#e0bd45;font-size:14px;">Invista em conhecimento</p></td></tr>
<tr><td style="padding:32px 24px;">
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#171717;">${titulo}</h1>
<p style="margin:0 0 24px;font-size:18px;line-height:1.6;">Use o código abaixo para ${purpose === "cadastro" ? "concluir seu cadastro na FinStart" : "entrar na sua conta FinStart"}:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 8px;background:#faf5df;border:2px solid #b68a15;border-radius:12px;">
<strong style="font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:1.3;font-weight:700;letter-spacing:6px;color:#171717;">${code}</strong></td></tr></table>
<p style="margin:24px 0 12px;font-size:17px;line-height:1.6;">Válido por <strong>10 minutos</strong> e para <strong>um único uso</strong>. Digite-o na página da FinStart onde você iniciou a solicitação.</p>
<p style="margin:0;font-size:16px;line-height:1.6;"><strong>Não compartilhe este código.</strong> A FinStart nunca pede seu código por mensagem ou telefone.</p>
<hr style="border:0;border-top:1px solid #e5e1d7;margin:24px 0;">
<p style="margin:0;font-size:14px;line-height:1.6;color:#626262;">Se você não solicitou este código, ignore esta mensagem. Nenhuma ação é necessária.</p>
</td></tr></table>
<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#626262;">FinStart · Educação financeira para o seu próximo passo.</p>
</td></tr></table></body></html>`,
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
