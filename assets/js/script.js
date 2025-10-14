const pagina_inicial = document.querySelector(".pagina-inicial");
const pagina_indices = document.querySelector(".container-indices");
const pagina_desempenho = document.querySelector(".container-desempenho");

// botões de home
const homeBtn = document.getElementById("home");
const homeBtn2 = document.getElementById("home2");

// botões página índices e desempenho
const indices = document.getElementById("indices");
const desempenho = document.getElementById("desempenho");

// listeners para índices e desempenho
indices.addEventListener("click", abrirIndices);
desempenho.addEventListener("click", abrirDesempenho);

// listeners para os botões home
homeBtn.addEventListener("click", () => {
  window.location.href = "/aplicativo-TAF/";
});

homeBtn2.addEventListener("click", () => {
  window.location.href = "/aplicativo-TAF/";
});

function abrirIndices() {
  pagina_inicial.style.display = "none";
  pagina_indices.classList.add("container-indices-active");
}

function abrirDesempenho() {
  pagina_inicial.style.display = "none";
  pagina_desempenho.classList.add("container-desempenho-active");
}

// funções para instalar o app
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Impede que o Chrome exiba o banner automático
  e.preventDefault();
  deferredPrompt = e;

  // Exibe seu próprio botão (ex: "Instalar App")
  const installButton = document.getElementById("instalarApp");
  installButton.style.display = "block";

  installButton.addEventListener("click", async () => {
    installButton.style.display = "none";
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário escolheu: ${outcome}`);
    deferredPrompt = null;
  });
});
