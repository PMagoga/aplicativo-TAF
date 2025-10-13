const indices = document.getElementById("indices");
const pagina_inicial = document.querySelector(".pagina-inicial");
const pagina_indices = document.querySelector(".container");

indices.addEventListener("click", abrirIndices);

function abrirIndices() {
  pagina_inicial.style.display = "none";
  pagina_indices.style.display = "block";
}
