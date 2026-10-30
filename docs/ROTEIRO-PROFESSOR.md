# Roteiro de apresentação da FinStart

Link público: https://finstart-publicacao.vercel.app/
Código: https://github.com/yurikikuchi2006/finstart

## O caminho de uma informação

Navegador → Vercel (HTML, CSS e JavaScript) → Render (API Node.js) → Aiven (MySQL).
A resposta percorre o caminho inverso para aparecer na tela. O Brevo entrega os códigos de confirmação por e-mail; o servidor gera e valida esses códigos.

## Demonstração sugerida — 8 a 10 minutos

1. Abra o link público da Vercel. Mostre que funciona pela internet, sem extrair o ZIP ou iniciar o servidor no computador.
2. Crie uma conta de demonstração com uma caixa de e-mail que você controla. Confirme o código diretamente no site. Não mostre senha ou código na projeção.
3. Salve um orçamento com valores fictícios. Recarregue a página e mostre que o registro continua disponível.
4. Mostre projeção de juros, criação e edição de uma meta, histórico do progresso e comparação de investimentos. Termine mostrando busca e filtros da biblioteca.
5. Saia e entre novamente. Confirme o novo código e recupere os registros salvos.
6. Abra o GitHub: mostre HTML/CSS/JavaScript, pasta server, arquivos SQL e histórico de commits. O ZIP é uma cópia para entrega; a publicação utiliza o repositório.
7. Abra a Vercel: mostre o domínio público e a publicação pronta. Explique que ela hospeda a interface e encaminha /api ao Render. Novos commits na branch main publicam a interface automaticamente.
8. Abra o Render: mostre o serviço ativo e o commit publicado. Explique que ele valida dados, autentica usuários, faz cálculos e acessa o banco. A atualização da API nesta configuração é manual pelo painel.
9. Abra o Aiven: mostre o serviço MySQL ativo e o esquema. Se apresentar uma consulta, use somente dados fictícios e colunas necessárias; não exiba hashes de senhas, sessões ou solicitações de códigos. Salvar e recuperar pelo site comprova a integração real, além do arquivo SQL.

## O que cada parte contém

| Parte | Papel |
| --- | --- |
| GitHub | Código e histórico de alterações |
| Vercel | Interface pública: HTML, CSS e JavaScript |
| Render | API e regras do sistema; credenciais ficam privadas |
| Aiven | Banco MySQL persistente, acessado pelo servidor com TLS |
| Brevo | Entrega de mensagens com códigos de confirmação |
| ZIP/PDF/DOCX | Materiais da entrega acadêmica |

## Conferência antes da aula

- Entre no site com antecedência: a instância gratuita do Render pode demorar para acordar após inatividade.
- Confira /api/saude: a resposta esperada é status ok e banco conectado.
- Teste recebimento do e-mail, inclusive spam, antes da demonstração.
- Use valores fictícios e deixe os painéis autenticados nas páginas de visão geral.
- Não projete variáveis privadas, chaves, cookies, senhas ou o backup SQL com dados de contas.
- Confira se ZIP, documentação e publicação representam a mesma versão final.

## Situação desta revisão

Em 30/10/2026, o link público e a conexão SQL responderam corretamente. A confirmação por e-mail está ativa. Yuri confirmou o recebimento no cadastro e no login, além de salvar e recuperar dados com o novo acesso. As ferramentas e quatro larguras de tela foram verificadas nas rodadas documentadas. O relatório distingue testes automatizados, confirmação manual e limitações.
