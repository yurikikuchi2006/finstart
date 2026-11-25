# Roteiro de apresentação da FinStart

- [Site publicado](https://finstart-publicacao.vercel.app/)
- [Saúde da API](https://finstart-publicacao.vercel.app/api/saude)
- [Validação e evidências](ENTREGA-4.md)

## Sequência da demonstração

1. Abrir /api/saude 15 minutos antes. Confirmar status ok e banco conectado. Abrir a página inicial e mostrar a navegação no celular.
2. Calcular o orçamento com renda de R$ 3.000, transferir a reserva de R$ 600 para Juros e abrir a meta preenchida.
3. Entrar com uma conta de demonstração, criar a meta, alterar o valor guardado e mostrar o progresso e o painel.
4. Sair e entrar novamente para conferir o valor persistido. Explicar o caminho navegador → Vercel → Render → Aiven.
5. Mostrar o acesso à recuperação de senha e informar o resultado do teste com e-mail real. Apresentar rotas, DER, scripts SQL e evidências.

## Situação da validação

Em 25/11, a jornada pública transferiu o aporte do orçamento à projeção e o resultado para a meta. A API e o proxy responderam com MySQL conectado. O teste local confirmou a gravação da meta, a persistência após novo login e a redefinição de senha com envio simulado. Na rodada publicada, a meta editada reapareceu no painel após novo login. O titular confirmou ter redefinido a senha com código real e entrado com a nova senha. Consulte o [registro da validação autenticada](evidencias/entrega-4/validacao-autenticada-producao.json).

Use dados fictícios e preserve a privacidade de senhas, códigos e endereços de e-mail nas capturas.
