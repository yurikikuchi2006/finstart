const menu = document.querySelector("header nav");
const toggle = document.createElement("button");
toggle.type = "button";
toggle.className = "menu-toggle";
toggle.textContent = "Menu ☰";
toggle.setAttribute("aria-expanded", "false");
menu.id = "navegacao";
toggle.setAttribute("aria-controls", "navegacao");
menu.before(toggle);
function definirMenu(aberto) {
  menu.classList.toggle("aberto", aberto);
  toggle.setAttribute("aria-expanded", String(aberto));
  toggle.textContent = aberto ? "Fechar ×" : "Menu ☰";
}
toggle.addEventListener("click", () => definirMenu(!menu.classList.contains("aberto")));
menu.parentElement.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !menu.classList.contains("aberto")) return;
  definirMenu(false);
  toggle.focus();
});
for (const a of menu.querySelectorAll("a")) {
  if (
    a.pathname === location.pathname ||
    (location.pathname === "/" && a.pathname === "/index.html")
  )
    a.setAttribute("aria-current", "page");
}
const footer = document.createElement("footer");
const brand = document.createElement("span"),
  info = document.createElement("span");
brand.textContent = "FinStart · Invista em conhecimento";
info.textContent = "Educação financeira para o seu próximo passo.";
footer.append(brand, info);
document.body.append(footer);

// Native step=any accepts centavos; keyboard/spinner step is handled separately in ui below.
for (const input of document.querySelectorAll('input[type="number"]')) {
  if (input.id === "taxa" || input.id === "meses" || input.id === "prazo")
    continue;
  input.addEventListener("keydown", (e) => {
    if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const n = Number(input.value) + (e.key === "ArrowUp" ? 1 : -1);
    input.value = String(
      Math.min(
        Number(input.max || Infinity),
        Math.max(Number(input.min || 0), Math.round(n * 100) / 100),
      ),
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

for (const form of document.forms) {
  form.addEventListener(
    "invalid",
    (e) => {
      e.target.setAttribute("aria-invalid", "true");
      const status = document.getElementById("status");
      if (status)
        status.textContent =
          "Confira os campos destacados: " + e.target.validationMessage;
    },
    true,
  );
  form.addEventListener("input", (e) => {
    if (e.target.validity)
      e.target.setAttribute("aria-invalid", String(!e.target.validity.valid));
  });
}

// Aceita centavos digitados e oferece controles explícitos de um real.
function prepararValores() {
  for (const input of document.querySelectorAll('input[type="number"]')) {
    if (
      input.dataset.moeda ||
      ![...input.labels].some((l) => l.textContent.includes("R$"))
    )
      continue;
    input.dataset.moeda = "true";
    input.step = "any";
    const wrap = document.createElement("div");
    wrap.className = "money-input";
    input.before(wrap);
    wrap.append(input);
    for (const [texto, delta] of [
      ["−", -1],
      ["+", 1],
    ]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "money-step";
      b.textContent = texto;
      b.setAttribute(
        "aria-label",
        (delta > 0 ? "Aumentar" : "Diminuir") +
          " um real: " +
          input.labels[0].textContent,
      );
      b.addEventListener("click", () => {
        input.value = String(
          Math.min(
            Number(input.max || Infinity),
            Math.max(
              Number(input.min || 0),
              Math.round((Number(input.value) + delta) * 100) / 100,
            ),
          ),
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      wrap.append(b);
    }
  }
}
prepararValores();
new MutationObserver(prepararValores).observe(
  document.getElementById("principal"),
  { childList: true, subtree: true },
);
