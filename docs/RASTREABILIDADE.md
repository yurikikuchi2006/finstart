# Rastreabilidade da 4ª entrega

Os resultados de outubro são registros históricos. A revisão de novembro distingue as verificações locais dos [registros da versão publicada](evidencias/entrega-4/fluxo-publico.json).

## Pontos da devolutiva da terceira entrega

| Ponto do professor | Resposta na revisão | Situação atual |
| --- | --- | --- |
| Consolidar o front-end e executar as funcionalidades que estavam parciais | Simplificamos a entrada da aplicação, melhoramos a leitura do painel e direcionamos o foco aos resultados dos cálculos. Os registros de [fluxo integrado](evidencias/validacao-final/fluxo-integrado-local.json) e de [navegação por teclado](evidencias/validacao-final/teclado-local.json) documentam as verificações locais. | Aprovado nas verificações locais e nas interações públicas registradas em 25/11. |
| Fortalecer o fluxo principal da FinStart | A renda informada gera uma reserva mensal, que preenche o aporte de Juros. A projeção preenche valor e prazo da meta. O painel mostra a meta após a criação e após novo login. | Cálculo e preenchimento da meta conferidos em produção. Persistência após novo login conferida localmente. |
| Incluir a coluna Situação atual nos requisitos não funcionais | A coluna consta no relatório cumulativo e na tabela de RNF abaixo. | Implementado. |
| Ligar requisitos ao código, aos testes e aos resultados | As tabelas abaixo relacionam os requisitos à implementação, aos testes e aos registros de evidência. O registro da revisão distingue evidência local de resultados históricos em produção. | Implementado com evidências locais e públicas identificadas. |
| Finalizar a documentação cumulativa | Esta matriz registra a devolutiva e os resultados novos. O relatório e o pacote consolidam as evidências públicas de 25/11. | Implementado. |

Na revisão local, `npm test` registrou **21 testes aprovados, zero falhas e um teste opcional de MySQL ignorado**. O build estático gerou 26 arquivos públicos. Os testes locais de autenticação usam um remetente simulado.

| Requisito | Implementação | Teste e evidência |
| --- | --- | --- |
| RF01 · Conta e sessão | `frontend/conta.js`, `frontend/api.js`, `server/verificacao-email.js` | `tests/verificacao-email.test.js`. Em produção, Yuri recebeu o código de cadastro no Spam do Gmail e o painel autenticado foi observado. Em ambiente local, cadastro, saída, novo login e redefinição de senha passaram com entrega simulada. Falta testar o novo login e a redefinição com e-mail real na versão final publicada. |
| RF02 · Conteúdos | `frontend/aprender.js`, `server/conteudos.js` | `tests/aulas.test.js` e [registro de filtros e leitura](VALIDACAO-FINAL.md). |
| RF03 · Orçamento | `frontend/simulador.js` | `tests/entrega-completa.test.js` e [registro de cálculo e histórico](VALIDACAO-FINAL.md). |
| RF04 · Projeção e gráfico | `frontend/juros.js`, `frontend/financas.js`, `frontend/graficos.js` | `tests/ferramentas.test.js` e [registro do gráfico e da tabela](VALIDACAO-FINAL.md). |
| RF05 · Comparação | `frontend/comparar.js`, `frontend/financas.js` | `tests/aulas.test.js` e [registro dos três cenários](VALIDACAO-FINAL.md). |
| RF06 · Metas | `frontend/metas.js`, `server/controllers.js` | `tests/ferramentas.test.js` e [registro de criação, edição e exclusão](VALIDACAO-FINAL.md). |
| RF07 · Progresso | `frontend/metas.js`, `server/controllers.js` | `tests/aulas.test.js` e [registro de aporte e histórico](VALIDACAO-FINAL.md). |
| RF08 · Painel e históricos | `frontend/painel.js`, `server/controllers.js` | `tests/integracao.test.js` e [registro de persistência e isolamento](VALIDACAO-FINAL.md). |
| Fluxo orçamento, projeção e meta | `frontend/simulador.js`, `frontend/juros.js`, `frontend/metas.js`, `frontend/painel.js` | [Aprovado no navegador local](evidencias/validacao-final/fluxo-integrado-local.json). Renda de R$ 3.000 levou R$ 600 de aporte à projeção. O saldo e o prazo de 12 meses preencheram a meta, que apareceu no painel e continuou disponível após novo login. A [rodada pública](evidencias/entrega-4/fluxo-publico.json) confirmou a transferência dos parâmetros. A persistência autenticada em produção segue pendente nesta rodada. |

| Requisito não funcional | Situação atual | Verificação |
| --- | --- | --- |
| RNF01 · Separação em camadas | Implementado | Páginas e módulos no front-end, rotas em `server/index.js`, regras em `frontend/financas.js` e esquemas em `database/`. |
| RNF02 · Validação e isolamento | Implementado | Validação e autorização em `server/controllers.js`. Ver [registro de isolamento](VALIDACAO-FINAL.md) e `tests/integracao.test.js`. |
| RNF03 · Responsividade, teclado e gráficos tabulares | Parcial | As oito páginas locais foram verificadas a 320, 390, 768 e 1280 px. Foram exercitados os resultados de Orçamento, Juros e Comparar, além de [menu, biblioteca, conta e operações de metas por teclado](evidencias/validacao-final/teclado-local.json). O [menu publicado foi conferido a 390 px](evidencias/entrega-4/menu-mobile-producao.json). Aparelho físico e leitor de tela seguem pendentes. |
| RNF04 · Configuração privada, backup e execução | Parcial | Há instruções no README e [restauração testada](evidencias/validacao-final/backup-restauracao.json). Frequência e responsável pelo backup ainda precisam ser definidos. |
