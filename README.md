# FinStart

Publicação mantida por Yuri: https://github.com/yurikikuchi2006/finstart. Esta cópia preserva o histórico do repositório acadêmico https://github.com/enzocayresferreira7-pixel/finstart. Para o status operacional mais recente, consulte [a validação complementar](docs/VALIDACAO-FINAL.md); os documentos acadêmicos recebidos registram a etapa anterior.

Plataforma web de educação financeira e planejamento para jovens. PUC-Campinas, Programação Web (2181161, conforme modelo oficial), turma 101.

## Apresentar a versão online

Abra https://finstart-publicacao.vercel.app em qualquer navegador com internet. Não é necessário instalar programas nem abrir terminal. Antes de apresentar, abra https://finstart-publicacao.vercel.app/api/saude e aguarde o retorno de banco conectado: o servidor gratuito pode demorar para despertar.

Frontend na Vercel, API Node/Express no Render e MySQL persistente na Aiven. O código do proxy está em `vercel.json`, a seleção dos arquivos públicos em `scripts/build-static.js`, a inicialização da API em `server/index.js`, a conexão TLS em `server/mysql.js` e as tabelas em `database/schema.mysql.sql`. Credenciais ficam nas variáveis privadas do Render. Consulte `docs/PUBLICACAO.md` para o alcance dos testes e `docs/APRESENTACAO-ONLINE.md` para o roteiro.

O ZIP guarda o código e os documentos, não os dados do MySQL online. Não misture arquivos soltos com versões antigas: extraia o pacote atualizado em uma pasta própria. A conexão automática GitHub → deploy ainda não foi concluída; um commit sozinho não confirma atualização do site.

## Executar localmente no Windows

Instale Node.js 24 ou superior e dê dois cliques em **INICIAR-FINSTART.cmd**. Na primeira execução, é necessária conexão à internet para instalar as dependências. O inicializador cria a configuração privada, inicia/confere o servidor e abre http://127.0.0.1:3000. Não abra o index.html diretamente como arquivo.

Alternativa pelo terminal: `npm install --omit=dev --ignore-scripts`, configurar `.env` a partir de `.env.example` e executar `node --env-file=.env server/index.js`. O arquivo `pnpm-lock.yaml` fixa a instalação com `pnpm install --frozen-lockfile`.

## Recursos

- Cadastro, login e logout com contas individuais.
- 15 conteúdos educativos com fontes oficiais: cinco básicos, cinco intermediários e cinco avançados; busca e filtros por categoria e nível.
- Orçamento 50/30/20 com histórico.
- Juros compostos, gráfico e tabela de evolução.
- Comparação de três cenários hipotéticos com taxas anuais predefinidas e histórico.
- Metas com criação, consulta, edição, exclusão, prazo, cálculo mensal necessário e registros de progresso.
- Painel por conta e navegação responsiva em preto e dourado.

As projeções não incluem inflação, tarifas ou impostos. Os cenários não são produtos reais, cotações ou promessa de rendimento.

## Banco e arquitetura

Monólito em camadas: HTML/CSS/JavaScript → API REST Node.js/Express → conexão SQL parametrizada. JWT assinado e verificado no servidor, cookie HttpOnly/SameSite=Strict, senhas com scrypt/salt e autorização por proprietário.

**Instalação de demonstração:** MySQL 8.0.45 exclusivo da FinStart, em `127.0.0.1:3308`, banco `finstart`. Os dados antigos foram copiados do SQLite, comparados campo a campo e preservados em backup. O inicializador inicia/confere essa instância quando `MYSQL_LOCAL=1`.

**Preparar MySQL exclusivo em outro Windows:** instale Node.js 24+ e MySQL Server 8.0.16+ (validado em 8.0.45), prepare as dependências e, com o site parado, execute `node scripts/configurar-mysql-local.js 3308`. O utilitário usa os binários instalados, cria `data/mysql`, gera credenciais privadas, copia o SQLite existente e só muda o `.env` após conferir todos os dados. Ele não altera o serviço MySQL anterior e recusa sobrescrever um diretório já existente. Depois use `INICIAR-FINSTART.cmd`. Para binários em outra pasta, configure `MYSQL_EXECUTABLE` no ambiente. Em caso de falha durante a preparação, preserve `data/` e consulte o erro antes de repetir.

**Servidor MySQL já administrado pelo grupo:** crie banco vazio UTF-8 e usuário restrito. Configure `.env`: `DB_DRIVER=mysql`, `MYSQL_LOCAL=0`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. A aplicação aplica `database/schema.mysql.sql`. Esse servidor precisa estar ativo. Mudar somente o driver não transfere contas.

**Ver no Workbench:** crie conexão Standard TCP/IP com host `127.0.0.1`, porta `3308`, usuário `finstart_leitura` e schema `finstart`. A senha está no arquivo privado `data/ACESSO-WORKBENCH.txt`. Execute `database/consultas-demonstracao.mysql.sql` para ver tabelas, colunas, relacionamentos e registros. Esse usuário só consulta; o acesso administrativo local fica separado em `data/mysql-administrador.txt`. Não compartilhe esses arquivos.

**Alternativa SQLite:** uma cópia nova sem configuração MySQL inicia com `data/finstart.sqlite`, usando `database/schema.sql`. Esse modo continua disponível para testes e execução simples; não sincroniza contas com MySQL nem com a nuvem.

São 10 tabelas e 8 relacionamentos: usuários, sessões, orçamentos, juros, metas, categorias, conteúdos, tipos de cenário, resultados de comparação e progresso de metas. A nomenclatura e os ajustes em relação ao MER planejado estão explicados no PDF.

## Verificar

Instale também as dependências de desenvolvimento com `npm install --ignore-scripts` ou `pnpm install --frozen-lockfile`.

- `node --test`: 10 testes locais; a integração MySQL é opcional e aparece como ignorada sem configuração.
- MySQL isolado: configure um `.env` para um banco exclusivo de teste e use `FINSTART_TEST_MYSQL=1` com `node --env-file=.env --test tests/mysql.test.js`. Não use um banco de produção para testes.
- `node scripts/evidencias.js`: gera evidências HTTP/SQL com dados fictícios em SQLite temporário.
- `npm run backup`: lê o `.env` e cria backup privado em `backups/`. SQLite usa cópia consistente; MySQL usa `mysqldump --single-transaction`, sem senha nos argumentos do processo. A restauração de um dump deve ser feita em banco vazio, com acesso administrativo, após verificar o destino.

## Organização e entrega

`server/` contém rotas, controllers, autenticação e adaptadores SQL; `database/`, os dois esquemas; `tests/`, verificações; `docs/`, PDFs, Kanban e evidências; `scripts/`, utilitários de verificação e backup. Páginas, estilos e módulos compartilhados ficam na raiz para manter o site multipágina simples. Os arquivos de inicialização são necessários.

Relatórios atuais: **docs/FinStart-Entrega-2-Corrigida.pdf** e **docs/FinStart-3a-Entrega-Revisada.pdf**, com versões editáveis DOCX. Ambos seguem as nove seções, a capa e os cabeçalhos do modelo oficial, turma 101. O primeiro complementa a entrega histórica de 01/10 com a correção datada de 28/10; não afirma que os novos recursos já existiam na entrega original. Conferência pelo grupo, publicação e envio no Canvas permanecem necessários.

`.env`, `data/`, `node_modules/`, `tmp/`, logs e backups ficam fora do Git e do ZIP público. Cada instalação possui seu banco; o pacote não contém contas pessoais. O Kanban registra a revisão atual e não inventa reuniões ou movimentações passadas.

## Equipe

Gabriel Polli Perin (25007439); Yuri Kikuchi (25007272); Enzo Cayres Ferreira (25000144); Eduardo dos Santos Fernandez (25000693); Paulo Henrique Scavariello Guimarães (25017738).

Programação Web: Fernando Luiz de Almeida Silveira. Bancos de Dados Relacionais: Felipe Cavalaro.
