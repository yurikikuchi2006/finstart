# FinStart · 4ª entrega

A FinStart é um projeto de Programação Web orientado na disciplina pelo professor Fernando Luiz de Almeida Silveira. A [aplicação publicada](https://finstart-publicacao.vercel.app/) permite explorar a biblioteca e as ferramentas de planejamento financeiro.

## Evolução desde a 3ª entrega

- O front-end foi organizado em `frontend/`. O fluxo principal leva o usuário do orçamento à projeção, da projeção à meta e da meta ao painel.
- A interface ganhou superfícies claras e gráficos exploráveis. O menu móvel foi simplificado e o painel ganhou acesso direto no cabeçalho. As animações respeitam a preferência por movimento reduzido.
- A documentação passou a registrar a situação dos requisitos não funcionais, com vínculos entre requisitos, implementação e testes.

## Validação técnica

| Verificação | Ambiente e resultado |
| --- | --- |
| Orçamento → projeção → meta | Em produção, uma reserva de R$ 600 foi transferida à projeção. O resultado de R$ 7.401,34 em 12 meses preencheu a meta. |
| Acesso móvel ao painel | Em navegador com largura de 390 px, o painel ficou acessível fora do menu. A tecla Esc fechou o menu e devolveu o foco. |
| API e banco | O Render e o proxy da Vercel retornaram HTTP 200 com MySQL conectado. A consulta de metas sem sessão retornou HTTP 401. |
| Criação de meta e recuperação após novo login | Conferidas localmente com dados fictícios e confirmação por e-mail simulada. |

Revisão de referência da interface: `a7277a4`. Revisão da API no Render registrada na validação: `7805ec8`. A recuperação de senha com entrega real de e-mail em produção ficou pendente de validação.

## Materiais para conferência

- [Roteiro de demonstração](ROTEIRO-PROFESSOR.md)
- [Matriz de rastreabilidade](RASTREABILIDADE.md)
- [Registros da 4ª entrega](evidencias/entrega-4/)
- [Instruções de execução local](../README.md#executar-localmente-no-windows)

O PDF acadêmico consolidado é a versão usada no Canvas.
