# Apresentação online da FinStart

## Preparação

Abra https://finstart-publicacao.vercel.app e aguarde o servidor despertar. Confira /api/saude no mesmo domínio: deve informar banco conectado. Use uma conta de demonstração, sem senha reutilizada. Leve o PDF e o ZIP atualizados como cópia de consulta. Nenhum terminal é necessário para navegar no site publicado. Internet é necessária.

## Roteiro de 5 a 7 minutos

1. Explique o problema: ajudar jovens a aprender, simular e planejar suas finanças. Mostre Início e Aprender, com os níveis e fontes.
2. Mostre o orçamento com renda de R$ 3.000: necessidades R$ 1.500, desejos R$ 900 e futuro R$ 600.
3. Em Juros, use R$ 1.000 iniciais, R$ 200 mensais, 0,5% e 24 meses. Resultado R$ 6.213,55; investido R$ 5.800 e juros R$ 413,55. Explique que são hipóteses educativas.
4. Entre na conta, salve uma projeção, crie uma meta e atualize seu progresso. Recarregue a página e consulte o histórico. Não informe que isso testa reinício do servidor: comprova recuperação dos dados no fluxo apresentado.
5. Explique a integração: navegador na Vercel → /api → Node/Express no Render → MySQL na Aiven. As senhas do banco nunca vão ao navegador.
6. Mostre no GitHub os arquivos abaixo e conclua com a evolução desde o protótipo e as limitações conhecidas.

## Código para mostrar ao professor

Repositório: https://github.com/yurikikuchi2006/finstart

| Arquivo | O que demonstra |
| --- | --- |
| vercel.json | Proxy /api e configuração de publicação estática |
| scripts/build-static.js | Seleção dos arquivos públicos, sem credenciais ou servidor |
| server/index.js | Rotas Express, PORT, HOST e validação da origem |
| server/controllers.js | Operações, validação e consultas por usuário |
| server/auth.js | JWT e tratamento das senhas |
| server/mysql.js | Conexão MySQL por variáveis privadas, com TLS |
| database/schema.mysql.sql | Tabelas, chaves e relacionamentos |
| scripts/verificar-online.mjs | Verificação HTTP real pelo endereço público |
| docs/PUBLICACAO.md | Resultados e limites dos testes |

Render usa build `pnpm install --frozen-lockfile` e start `node server/index.js`. A configuração efetiva foi feita no painel. `render.yaml` é uma alternativa Docker e não representa exatamente o serviço nativo criado. Aiven é o serviço que executa o MySQL; não há um frontend separado para ele. O esquema é inicializado pela aplicação e a conexão fica em server/mysql.js.

## Salvar e manter

Use o GitHub para histórico do código e o ZIP atualizado para compartilhar uma cópia. Preserve o PDF no pacote. O banco em nuvem é separado: salvar código não faz backup dos registros. Um backup externo foi restaurado e comparado em MySQL local isolado. O dump privado não integra o ZIP; a rotina e retenção das próximas cópias devem ser definidas. Não compartilhe .env, senhas, tokens, certificados privados ou dados pessoais. Para mostrar tabelas no Workbench, use uma conexão autorizada com TLS, sem projetar credenciais na tela.

## Limites que devem ser informados

Os testes HTTP finais, fluxos visuais/mobile em quatro larguras, persistência após reinício e restauração isolada do backup passaram. A Vercel publica por commit. O Render usa a mesma cópia, mas exige Manual Deploy > Deploy latest commit. Auditorias completas de acessibilidade e segurança e uso em aparelho físico não foram realizados. Recuperação de senha e verificação de e-mail não estão implementadas. Hospedagem gratuita pode demorar no primeiro acesso.
