import { carregarPainel } from "./painel.js";
import { api } from "./api.js";
const $ = (id) => document.getElementById(id);
let desafio;
let contadorReenvio;
function aguardarReenvio() {
  clearInterval(contadorReenvio);
  const atualizarContador = () => {
    const segundos = Math.max(
      0,
      desafio?.reenvio_em - Math.floor(Date.now() / 1000),
    );
    $("reenviar").disabled = !desafio || segundos > 0;
    $("reenvio-status").textContent = segundos
      ? `Você pode solicitar outro código em ${segundos} segundos.`
      : "Não recebeu? Confira o spam ou solicite um novo código.";
    if (!segundos) clearInterval(contadorReenvio);
  };
  atualizarContador();
  contadorReenvio = setInterval(atualizarContador, 1000);
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
  aguardarReenvio();
  $("codigo").focus();
}
const mostrar = (texto) => {
  $("mensagem").textContent = texto;
};
async function atualizar() {
  try {
    const user = await api("me");
    $("formularios").hidden = true;
    $("perfil").hidden = false;
    $("verificacao").hidden = true;
    $("boas-vindas").textContent = "Olá, " + user.nome;
    await carregarPainel();
  } catch {
    $("formularios").hidden = false;
    $("perfil").hidden = true;
    for (const id of ["indicadores", "painel-metas", "painel-simulacoes"])
      $(id).replaceChildren();
  }
}
for (const id of ["login", "cadastro"])
  $(id).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      botao = form.querySelector("button:last-child");
    botao.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      const resposta = await api(id, "POST", body);
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
      } else {
        mostrar("Login realizado.");
        await atualizar();
      }
    } catch (e) {
      mostrar(e.message);
    } finally {
      botao.disabled = false;
    }
  });
$("codigo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!desafio) return;
  const button = event.submitter;
  button.disabled = true;
  try {
    await api("confirmar-email", "POST", {
      desafio_id: desafio.desafio_id,
      codigo: $("codigo").value.trim(),
    });
    desafio = undefined;
    clearInterval(contadorReenvio);
    $("codigo-form").reset();
    mostrar("E-mail confirmado. Login realizado.");
    await atualizar();
  } catch (e) {
    mostrar(e.message);
    $("codigo").setAttribute("aria-invalid", "true");
    $("codigo").focus();
  } finally {
    button.disabled = false;
  }
});
$("reenviar").addEventListener("click", async () => {
  if (!desafio) return;
  $("reenviar").disabled = true;
  try {
    desafio = await api("reenviar-codigo", "POST", {
      desafio_id: desafio.desafio_id,
    });
    $("codigo").value = "";
    mostrar(desafio.mensagem);
    aguardarReenvio();
  } catch (e) {
    mostrar(e.message);
    if (desafio) {
      desafio.reenvio_em = Math.floor(Date.now() / 1000) + 60;
      aguardarReenvio();
    }
  }
});
$("cancelar-codigo").addEventListener("click", () => {
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
    await atualizar();
    mostrar("Sessão encerrada.");
  } catch (e) {
    mostrar(e.message);
  }
});
atualizar();
