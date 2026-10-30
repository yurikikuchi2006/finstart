import { mkdir, copyFile } from 'node:fs/promises';
const files = ['404.html','index.html','aprender.html','comparar.html','conta.html','juros.html','metas.html','projeto.html','simulador.html','ambiente.js','api.js','aprender.js','comparar.js','conta.js','dominio.js','financas.js','graficos.js','juros.js','metas.js','painel.js','shell.js','simulador.js','ui.js','style.css','logo_FinStart.png'];
await mkdir('dist', { recursive: true });
for (const file of files) await copyFile(file, `dist/${file}`);
console.log(`${files.length} arquivos públicos preparados em dist.`);
