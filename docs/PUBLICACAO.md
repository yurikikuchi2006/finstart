# Publicação validada

Site: https://finstart-publicacao.vercel.app

Código operacional: https://github.com/yurikikuchi2006/finstart

A cópia preserva o histórico do repositório de Enzo. Vercel e Render usam a cópia de Yuri, mantendo os serviços existentes e o MySQL da Aiven. A Vercel foi validada com commits disparando deploy Ready. O Render publicou a nova origem como Live; pela conexão pública atual, os próximos deploys da API são manuais.

Build Vercel: node scripts/build-static.js; saída dist; somente 25 arquivos públicos. vercel.json mantém proxy API, cabeçalhos de segurança e 404 explícito. deploy/Dockerfile e render.yaml são alternativas; o Render existente continua Node nativo.

Resultados atuais, evidências, backup restaurado e limites: [VALIDACAO-FINAL.md](VALIDACAO-FINAL.md). O relatório acadêmico PDF/DOCX foi atualizado e revisado em 16 páginas. A apresentação depende de internet e dos provedores.
