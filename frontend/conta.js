import { carregarPainel } from "./painel.js";
import { api } from "./api.js";
const $ = (id) => document.getElementById(id);
let desafio;
let desafioRecuperacao;
let contadorReenvio;
let enviando = false;
let operacao = 0;
const mensagem = $("mensagem");
const proximaSecao = mensagem.nextElementSibling;
const contaApi = (path, method, body) => api(path, method, body, 25000);

function moverMensagem(form) {
  if (form) form.append(mensagem);
  else proximaSecao.before(mensagem);
}

async function processar(botao, texto, acao) {
  if (enviando) return;
  operacao++;
  enviando = true;
  botao.disabled = true;
  mostrar(texto);
  const rotulo = botao.textContent;
  botao.textContent = texto;
  try {
    await acao();
  } catch (erro) {
    mostrar(erro.message);
  } finally {
    enviando = false;
    botao.disabled = false;
    botao.textContent = rotulo;
    if (desafio) aguardarReenvio();
  }
}
function aguardarReenvio() {
  clearInterval(contadorReenvio);
  const atualizarContador = () => {
    const segundos = Math.max(
      0,
      desafio?.reenvio_em - Math.floor(Date.now() / 1000),
    );
    $("reenviar").disabled = enviando || !desafio || segundos > 0;
    $("reenvio-status").textContent = segundos
      ? `Você pode solicitar outro código em ${segundos} segundos.`
      : "Não recebeu? Confira o spam ou solicite um novo código.";
    if (!segundos) clearInterval(contadorReenvio);
  };
  contadorReenvio = setInterval(atualizarContador, 1000);
  atualizarContador();
}
function pedirCodigo(resposta, email) {
  desafio = resposta;
  $("formularios").hidden = true;
  $("perfil").hidden = true;
  $("verificacao").hidden = false;
  $("verificacao-titulo").textContent =
    resposta.finalidade === "cadastro"
      ? "Confirme seu e-mail para criar a conta"
      : "Confirme seu acesso";
  $("verificacao-destino").textContent =
    `Enviamos um código para ${email}. Confira também o spam.`;
  $("codigo").value = "";
  moverMensagem();
  aguardarReenvio();
  $("codigo").focus();
}
const mostrar = (texto) => {
  $("mensagem").textContent = texto;
};
function abrirPainel(user, focar = false) {
  moverMensagem();
  $("formularios").hidden = true;
  $("perfil").hidden = false;
  $("verificacao").hidden = true;
  $("recuperacao").hidden = true;
  $("boas-vindas").textContent = "Olá, " + user.nome;
  if (focar) $("boas-vindas").focus();
  void carregarPainel();
}
async function atualizar(focar = false) {
  const atual = operacao;
  try {
    const user = await contaApi("me");
    if (atual !== operacao) return;
    abrirPainel(user, focar);
  } catch (erro) {
    if (atual !== operacao) return;
    if (erro.status !== 401) throw erro;
    $("formularios").hidden = false;
    $("perfil").hidden = true;
    $("verificacao").hidden = true;
    for (const id of ["indicadores", "painel-metas", "painel-simulacoes"])
      $(id).replaceChildren();
    if (focar) $("login-email").focus();
  }
}
for (const id of ["login", "cadastro"])
  $(id).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      botao = event.submitter ?? form.querySelector('button:not([type="button"])');
    if (enviando) return;
    moverMensagem(form);
    await processar(
      botao,
      id === "login" ? "Entrando…" : "Enviando cadastro…",
      async () => {
        const body = Object.fromEntries(new FormData(form));
        const resposta = await contaApi(id, "POST", body);
        form.reset();
        if (resposta?.desafio_id) {
          mostrar(resposta.mensagem);
          pedirCodigo(resposta, body.email);
          return;
        }
        if (id === "cadastro") {
          mostrar("Conta criada. Entre com seu e-mail e senha.");
          $("contador").textContent = "0/50 caracteres";
          $("forca").textContent =
            "Use pelo menos 8 caracteres, com letra e número.";
          moverMensagem();
          $("login-email").value = body.email;
          $("login-email").focus();
        } else {
          abrirPainel(resposta, true);
          mostrar("Login realizado.");
        }
      },
    );
  });
$("codigo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!desafio || enviando) return;
  await processar(
    event.currentTarget.querySelector("button"),
    "Confirmando…",
    async () => {
      await contaApi("confirmar-email", "POST", {
        desafio_id: desafio.desafio_id,
        codigo: $("codigo").value.trim(),
      });
      desafio = undefined;
      clearInterval(contadorReenvio);
      $("codigo-form").reset();
      await atualizar(true);
      mostrar("E-mail confirmado. Login realizado.");
    },
  );
});
$("reenviar").addEventListener("click", async () => {
  if (!desafio || enviando) return;
  await processar($("reenviar"), "Reenviando…", async () => {
    desafio = await contaApi("reenviar-codigo", "POST", {
      desafio_id: desafio.desafio_id,
    });
    $("codigo").value = "";
    mostrar(desafio.mensagem);
  });
});
$("cancelar-codigo").addEventListener("click", () => {
  if (enviando) return;
  desafio = undefined;
  clearInterval(contadorReenvio);
  $("codigo-form").reset();
  $("verificacao").hidden = true;
  $("formularios").hidden = false;
  mostrar("Você pode entrar ou iniciar um novo cadastro.");
  $("login-email").focus();
});
$("nome").addEventListener(
  "input",
  () => ($("contador").textContent = $("nome").value.length + "/50 caracteres"),
);
$("senha").addEventListener("input", () => {
  const s = $("senha").value;
  $("forca").textContent =
    s.length >= 8 && /\p{L}/u.test(s) && /\d/.test(s)
      ? "Formato aceito. Prefira uma senha longa e exclusiva."
      : "Use pelo menos 8 caracteres, com letra e número.";
});
$("alternar").addEventListener("click", () => {
  const show = $("senha").type === "password";
  $("senha").type = show ? "text" : "password";
  $("alternar").textContent = show ? "Ocultar senha" : "Mostrar senha";
  $("alternar").setAttribute("aria-pressed", String(show));
});
$("sair").addEventListener("click", async () => {
  try {
    await api("logout", "POST");
    await atualizar(true);
    mostrar("Sessão encerrada.");
  } catch (e) {
    mostrar(e.message);
  }
});
function fecharRecuperacao() {
  desafioRecuperacao = undefined;
  $("recuperar-form").reset();
  $("recuperar-form").hidden = false;
  $("redefinir-form").reset();
  $("redefinir-form").hidden = true;
  $("recuperacao").hidden = true;
  $("formularios").hidden = false;
  $("login-email").focus();
}
$("esqueci-senha").addEventListener("click", () => {
  if (enviando) return;
  operacao++;
  moverMensagem();
  mostrar("");
  $("recuperar-email").value = $("login-email").value;
  $("login-senha").value = "";
  $("formularios").hidden = true;
  $("recuperacao").hidden = false;
  $("recuperar-email").focus();
});
$("cancelar-recuperacao").addEventListener("click", () => {
  if (enviando) return;
  fecharRecuperacao();
  mostrar("");
});
$("recuperar-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (enviando) return;
  await processar(event.submitter, "Solicitando código…", async () => {
    const resposta = await contaApi("esqueci-senha", "POST", {
      email: $("recuperar-email").value,
    });
    desafioRecuperacao = resposta.desafio_id;
    $("recuperar-form").hidden = true;
    $("redefinir-form").reset();
    $("redefinir-form").hidden = false;
    mostrar(resposta.mensagem);
    $("recuperar-codigo").focus();
  });
});
$("redefinir-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (enviando || !desafioRecuperacao) return;
  await processar(event.submitter, "Salvando…", async () => {
    await contaApi("redefinir-senha", "POST", {
      desafio_id: desafioRecuperacao,
      codigo: $("recuperar-codigo").value.trim(),
      senha: $("nova-senha").value,
    });
    $("login-email").value = $("recuperar-email").value;
    fecharRecuperacao();
    mostrar("Senha alterada. Entre com a nova senha.");
  });
});
contaApi("auth-config").then(({ verificacao_email }) => {
  $("esqueci-senha").hidden = !verificacao_email;
}).catch(() => {});
atualizar().catch((erro) => {
  if (!enviando && !desafio) mostrar(erro.message);
});
