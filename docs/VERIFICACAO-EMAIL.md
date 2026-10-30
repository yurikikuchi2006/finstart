# Confirmação de e-mail e acesso em duas etapas

A interface coleta o código, mas o backend gera, envia e valida. A chave Brevo e o segredo de assinatura nunca vão ao navegador. O envio usa a API HTTPS, porque o Render gratuito bloqueia as portas SMTP habituais.

## Fluxos

No cadastro, os dados são validados e uma solicitação temporária recebe apenas o hash da senha. O usuário só é inserido depois de confirmar o e-mail. Após confirmação, recebe sessão em cookie HttpOnly, Secure e SameSite=Strict. No login seguinte, senha correta inicia uma nova solicitação: nenhum cookie de sessão é emitido antes do código. Contas anteriores também precisam do código no próximo login; seus dados e senhas não são alterados.

O código tem seis dígitos, validade de dez minutos e uso único. O servidor armazena HMAC associado ao identificador aleatório da solicitação, nunca o código em texto puro. Há cinco tentativas por código, intervalo de sessenta segundos para novo envio, até cinco envios por endereço por hora e cota de 250 envios diários da aplicação. A confirmação usa transação e consumo condicional, evitando dois logins com o mesmo código. Reenvio invalida o código anterior. Não existe reenvio automático.

O acesso depende também da caixa postal: esta é uma confirmação de acesso por e-mail, sem afirmar proteção contra phishing equivalente a passkeys ou aplicativos autenticadores.

## Banco

Migração aditiva: usuarios recebe email_verificado_em. As tabelas desafios_email e email_limites guardam solicitações temporárias e limites persistentes. O núcleo financeiro é preservado. O esquema passa de dez para doze tabelas, com nove chaves estrangeiras. Não há DROP, importação sobre a nuvem ou redefinição de contas. Códigos e limites continuam válidos após reinício da API conforme sua expiração.

## Variáveis privadas do Render

- EMAIL_OTP_ENABLED=true ativa a etapa obrigatória; false mantém o fluxo anterior enquanto a implantação é preparada.
- EMAIL_FROM identifica o remetente verificado no Brevo.
- BREVO_API_KEY contém a chave dedicada FinStart-OTP, somente no ambiente privado.

Quando a etapa está ativa, ausência de chave ou remetente impede a inicialização. Falha de envio não abre sessão nem cria conta: a interface mostra erro compreensível. Não colocar chave, código real, cookie ou dados de contas no GitHub, ZIP ou relatório.

A chave foi autorizada com acesso restrito ao recurso E-mails transacionais. O painel oferece Todos para esse recurso, incluindo envio, modelos e logs; os demais recursos não recebem acesso. A validade configurada é até 30/10/2027, sujeita também à expiração após noventa dias de inatividade. Revisar a validade antes de uma apresentação após longo intervalo. O plano gratuito do Brevo permite 300 envios por dia; outros envios da conta consomem a mesma cota. Remetente Gmail pode ser reescrito pelo provedor para atender às regras de entrega.

## API

- GET /api/auth-config: informa apenas se a confirmação de e-mail está ativa.
- POST /api/cadastro e /api/login: com a etapa ativa, retornam 202 com desafio_id, finalidade, expira_em e reenvio_em. Não retornam código, hash, chave ou cookie de sessão.
- POST /api/confirmar-email: recebe desafio_id e codigo. Só após sucesso emite a sessão.
- POST /api/reenviar-codigo: recebe desafio_id; exige intervalo e limites.

## Validação e situação

Testes locais de API aprovam cadastro pendente, senha sem sessão, código incorreto, cinco erros, expiração, reenvio, cota diária, falha do provedor, concorrência e persistência ao reabrir o banco. Playwright aprovou a interface em 320, 390, 768 e 1280 px com remetente simulado. MySQL local isolado aprovou migração sem perda dos registros anteriores e uso único concorrente; a integração MySQL opcional também foi executada e aprovada separadamente.

Yuri confirmou nesta conversa o recebimento dos códigos de cadastro e login e a gravação e recuperação de dados com o novo acesso. Resultado informado pelo usuário, distinto dos testes automatizados locais. Nenhum código real, senha, endereço de conta ou cookie é publicado como evidência.

A verificação HTTP confirmou banco conectado e verificação_email=true. O novo layout do e-mail foi conferido com código fictício em desktop e 320 px; nove testes de e-mail passaram após a alteração.


Fontes: https://render.com/docs/free ; https://developers.brevo.com/docs/send-a-transactional-email ; https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
