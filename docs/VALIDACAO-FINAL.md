# Validação complementar da publicação em 29/10/2026

Esta rodada complementa o relatório acadêmico e as evidências anteriores. Site: https://finstart-publicacao.vercel.app. A arquitetura Vercel, Render e Aiven foi preservada.

## Código e publicação

O ZIP recebido tinha 92 arquivos e correspondia ao commit ad550be do repositório original, desconsiderando apenas quebras de linha. A pedido de Yuri, foi criada a cópia https://github.com/yurikikuchi2006/finstart com todas as branches disponíveis e o histórico. O repositório original de enzocayresferreira7-pixel foi preservado.

O projeto existente finstart-publicacao foi conectado à cópia de Yuri. O build usa `node scripts/build-static.js`, saída `dist` e preset Other. O Dockerfile alternativo foi movido para `deploy/Dockerfile`; render.yaml referencia esse caminho com contexto na raiz. O serviço Render existente é Node nativo e não usa essa alternativa Docker. A conexão ao Git não comprova, sozinha, publicação automática; consultar o resultado efetivo do deploy antes de apresentar.

## Verificações executadas agora

- Saúde direta e pelo proxy: HTTP 200, status ok e banco conectado.
- Cadastro e login pela interface publicada com dados fictícios; painel individual acessível.
- Orçamento de R$ 3.000: R$ 1.500, R$ 900 e R$ 600; gravação e histórico consultados pela interface.
- Projeção com R$ 1.000, aporte de R$ 200, 0,5% mensal e 24 meses: R$ 6.213,55; investido R$ 5.800 e juros R$ 413,55. Gráfico, tabela, gravação e histórico consultados.
- Meta fictícia de R$ 6.000 em 12 meses: criação, edição para saldo de R$ 1.500, progresso de 25%, aporte de R$ 375 e histórico de progresso consultados.
- Reinício controlado da API registrado no painel Render às 23h23 de 29/10, horário de São Paulo. Após o reinício, uma nova aba e uma recarga recuperaram a meta e o saldo. Orçamento e projeção também foram consultados após o reinício.
- Comparação calculada, salva e consultada: cenários de 4%, 7% e 10% anuais com saldos de R$ 6.066,72, R$ 6.270,34 e R$ 6.477,03.
- Biblioteca carregou 15 conteúdos; filtro Avançado retornou cinco; busca sem correspondência mostrou estado vazio; Limpar filtros recuperou os 15; leitura expansível testada.
- Exclusões dos quatro tipos de registros fictícios acionadas na interface. Consulta final autenticada pela API confirmou as quatro listas vazias. Duas contas fictícias foram criadas nesta rodada e permanecem; não representam o total histórico de contas de teste.
- Verificação HTTP complementar confirmou cookie HttpOnly, Secure e SameSite=Strict; logout seguido de consulta da sessão retornou 401.
- Suíte local: 11 aprovados, zero falhas, um MySQL opcional ignorado. A primeira tentativa teve bloqueio de conexões locais do ambiente; a execução com acesso às conexões necessárias passou. O teste ignorado não foi aprovado.

## Banco e backup

O painel Aiven confirmou Running, MySQL 8.4.11 e plano Free-1-1gb. Mostrou um backup completo do provedor em 29/10/2026 às 16:37:13 UTC (13:37:13 em São Paulo).

Foi exportado um dump externo consistente com mysqldump, TLS VERIFY_IDENTITY, certificado CA e transação única. O arquivo de 25.679 bytes foi restaurado em uma instância MySQL 8.0.45 local isolada, em banco novo. A comparação das dez tabelas por contagem e hash do conteúdo encontrou igualdade em todas. A instância temporária foi encerrada. Não foi feita restauração sobre a produção, nem foi validada recuperação em uma segunda instância Aiven 8.4. O backup contém dados privados e permanece separado do GitHub e do ZIP público.

SHA-256 do dump: `81636286b40129fb38f135d0dc3cb017a945e03ae4f37746d49d21024dfea6c9`.

## Limites e pendências

- Revisão mobile online completa pendente: o controle de viewport não produziu a largura solicitada; não há nova aprovação mobile nesta rodada. Evidências responsivas anteriores continuam históricas.
- Não houve auditoria completa de acessibilidade ou segurança, nem repetição integral do script HTTP com duas contas. O isolamento entre contas permanece evidência da rodada anterior.
- Confirmar deploy automático efetivo da Vercel e do Render, distinguindo conexão/configuração de execução concluída.
- Definir responsável, frequência e armazenamento externo protegido dos backups; repetir restauração periodicamente. A existência de uma cópia local não configura agendamento ou retenção automática.
- PDF e DOCX recebidos são o retrato anterior desta entrega. Este registro complementa seu status operacional. A nova exportação diagramada do DOCX depende de um renderizador disponível; não declarar que o relatório acadêmico foi regenerado sem isso.
- Recuperação de senha e verificação de e-mail continuam fora do escopo implementado.

## Apresentação e manutenção

Antes da apresentação, abrir o site e `/api/saude`; aguardar banco conectado. Usar navegador e internet, sem instalação no notebook da faculdade. Seguir docs/APRESENTACAO-ONLINE.md, informar que os cenários são educativos e que o plano gratuito pode demorar para despertar.

Para alterar a publicação, trabalhar na cópia de Yuri, testar, enviar commit para main e conferir o deploy no painel. Conferir saúde, login e uma gravação depois da publicação. GitHub e ZIP guardam código; dados online e backups têm ciclo separado. O Render ainda deve ter sua origem efetiva conferida antes de assumir que um commit na cópia atualiza a API.
