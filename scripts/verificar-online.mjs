import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const base = process.env.TEST_BASE_URL;
if (!base?.startsWith('https://')) throw Error('Defina TEST_BASE_URL HTTPS');
const conta = {nome:'Verificacao online',email:`teste-${Date.now()}@example.com`,senha:randomBytes(20).toString('hex')+'Aa1'};
let cookie;
async function call(path,method='GET',body,session=cookie) {
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(session?{Cookie:session}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(120000)});
 const data=r.status===204?null:await r.json();
 return {status:r.status,data,cookie:r.headers.get('set-cookie')};
}
const ok=(label)=>console.log('PASS '+label);
assert.equal((await fetch(base)).status,200);ok('pagina publica');
assert.equal((await call('saude')).data.banco,'conectado');ok('proxy e MySQL');
const config=await call('auth-config');
if(config.status===200&&config.data.verificacao_email){
 console.log('SKIP fluxos autenticados deste script legado: verificação por e-mail ativa. Use uma caixa postal própria e o roteiro de docs/VERIFICACAO-EMAIL.md. Nenhum cadastro ou e-mail fictício foi enviado.');
 process.exit(0);
}
assert.equal((await call('me')).status,401);
assert.equal((await call('cadastro','POST',conta)).status,201);ok('cadastro');
const login=await call('login','POST',conta);assert.equal(login.status,200);
assert.match(login.cookie,/HttpOnly/i);assert.match(login.cookie,/Secure/i);assert.match(login.cookie,/SameSite=Strict/i);
cookie=login.cookie.split(';')[0];assert.equal((await call('me')).status,200);ok('login e cookie seguro');
const input={inicial_centavos:100000,aporte_centavos:20000,taxa:0.5,meses:24};
assert.equal((await call('calcular','POST',input)).data.saldo_centavos,621355);ok('calculo juros');
const ids=[];
for(const [route,body] of [['simulacoes',{renda_centavos:300000}],['juros',input],['metas',{titulo:'Reserva de teste',alvo_centavos:100000}]]) {
 const r=await call(route,'POST',body);assert.equal(r.status,201);ids.push([route,r.data.id]);assert.ok((await call(route)).data.some(x=>x.id===r.data.id));ok('salvar e consultar '+route);
}
const meta=ids.find(x=>x[0]==='metas')[1];
assert.equal((await call('metas/'+meta,'PUT',{guardado_centavos:20000})).status,204);
assert.ok((await call('metas/'+meta+'/progresso')).data.length);ok('progresso meta');
assert.ok((await call('comparar','POST',input)).data.length);const comp=await call('comparacoes','POST',input);assert.equal(comp.status,201);ids.push(['juros',comp.data.id]);assert.ok((await call('comparacoes')).data.length);ok('comparacao e historico');
assert.ok((await call('conteudos')).data.length);ok('conteudos');
const other={...conta,email:'outro-'+conta.email};assert.equal((await call('cadastro','POST',other)).status,201);
const otherCookie=(await call('login','POST',other)).cookie.split(';')[0];
for(const [route,id] of ids){assert.deepEqual((await call(route,'GET',undefined,otherCookie)).data,[]);assert.equal((await call(route+'/'+id,'DELETE',undefined,otherCookie)).status,404);}ok('isolamento contas');
assert.equal((await call('logout','POST')).status,204);assert.equal((await call('me')).status,401);
cookie=(await call('login','POST',conta)).cookie.split(';')[0];assert.equal((await call('metas')).data[0].guardado_centavos,20000);ok('persistencia apos novo login');
for(const [route,id] of ids) assert.equal((await call(route+'/'+id,'DELETE')).status,204);ok('exclusao registros teste');
for(const path of ['/.env','/server/index.js','/database/schema.mysql.sql']) assert.equal((await fetch(base+path)).status,404);ok('arquivos privados indisponiveis');
await call('logout','POST');
console.log('Concluido. Contas ficticias mantidas; registros de teste excluidos. Nao testa reinicio nem interface visual.');
