import { fetchDadosTAF, encontrarFaixaEtaria } from "./utils.js";

document
  .getElementById("calcularDesempenho")
  .addEventListener("click", calcularDesempenho);

/**
 * Função que compara o resultado do usuário com os limites da tabela
 * e retorna o conceito (I, R, B, MB, E, Suficiência etc.).
 *
 * Regras chave:
 * - Para barras normais (tipoTeste contendo "barra"), se existir "Suficiência"
 *   o código tenta encontrar qual sub-conceito (E, MB, B, R) se aplica.
 * - Para "sustentação" (caso feminino >=40 no exemplo), tratamos Suficiência/Insuficiência
 *   sem mapear para E/MB/B/R: Suficiência mantém peso 2; Insuficiência puxa para 1.
 */
function obterNota(resultado, requisitosFaixa, tipoTeste) {
  if (resultado === null) return "NA";

  const isBarraFixa = tipoTeste.toLowerCase().includes("barra"); // ex: "barra fixa"
  const isSustentacao = tipoTeste.toLowerCase().includes("sustent"); // ex: "sustentação"

  for (const nota in requisitosFaixa) {
    const requisito = String(requisitosFaixa[nota]);
    const limiteNumerico = Number(requisito.replace(/[^0-9]/g, ""));

    // 1️⃣ Caso de SUFICIÊNCIA
    if (
      nota.toLowerCase() === "suficiência" ||
      nota.toLowerCase() === "suficiencia"
    ) {
      const valorSuficiencia = Number(requisito.replace(/[^0-9]/g, ""));

      // --- Caso: Barra fixa "normal" (ex.: menores de 40) ---
      // Se for barra fixa e não for sustentação (ou for barra fixa comum),
      // e o resultado >= suficiência, tentamos mapear para E/MB/B/R
      if (isBarraFixa && !isSustentacao && resultado >= valorSuficiencia) {
        for (const subNota of ["E", "MB", "B", "R"]) {
          if (requisitosFaixa[subNota]) {
            const req = String(requisitosFaixa[subNota]);
            // ≥
            if (req.includes("≥")) {
              const valor = Number(req.replace(/[^0-9]/g, ""));
              if (resultado >= valor) return subNota;
            }
            // faixa Min-Max
            if (req.includes("-")) {
              const [minStr, maxStr] = req.split("-");
              const min = Number(minStr.replace(/[^0-9]/g, ""));
              const max = Number(maxStr.replace(/[^0-9]/g, ""));
              if (resultado >= min && resultado <= max) return subNota;
            }
            // valor único (ex: "4" ou "9")
            if (
              !req.includes("≤") &&
              !req.includes("≥") &&
              !req.includes("-")
            ) {
              const valor = Number(req.replace(/[^0-9]/g, ""));
              // para R: exigir igualdade; para E: >=; para outros, aceitar >=
              if (subNota === "R") {
                if (resultado === valor) return subNota;
              } else {
                if (resultado >= valor) return subNota;
              }
            }
          }
        }
        // se não encontrou sub-conceito, mantém "Suficiência"
        return "Suficiência";
      }

      // --- Caso: Sustentação (ex.: feminino >= 40) ---
      // Aqui NÃO tentamos mapear para E/MB/B/R: tratamos Suficiência / Insuficiência direto.
      if (isSustentacao) {
        if (resultado >= valorSuficiencia) return "Suficiência";
        return "Insuficiência";
      }

      // --- Caso geral (não barra fixa nem sustentação) ---
      if (resultado >= valorSuficiencia) return "Suficiência";
      return "Insuficiência";
    }

    // 2️⃣ Maior ou igual (≥)
    if (requisito.includes("≥")) {
      if (resultado >= limiteNumerico) return nota;
    }

    // 3️⃣ Faixa numérica (min-max)
    if (requisito.includes("-")) {
      const [minStr, maxStr] = requisito.split("-");
      const min = Number(minStr.replace(/[^0-9]/g, ""));
      const max = Number(maxStr.replace(/[^0-9]/g, ""));
      if (resultado >= min && resultado <= max) return nota;
    }

    // 4️⃣ Valor único (sem operador)
    if (
      !requisito.includes("-") &&
      !requisito.includes("≤") &&
      !requisito.includes("≥")
    ) {
      if (nota === "R" && resultado === limiteNumerico) return nota;
      if (nota === "E" && resultado >= limiteNumerico) return nota;
    }

    // 5️⃣ Menor ou igual (≤)
    if (requisito.includes("≤")) {
      if (resultado <= limiteNumerico) return nota;
    }
  }

  return "NA (Insuficiente)";
}

/**
 * Função principal de cálculo de desempenho.
 *
 * Observações:
 * - Para o caso específico que você pediu (LEMB, feminino, >=40),
 *   chamamos obterNota com tipoTeste = "sustentação" para que o comportamento
 *   de Suficiência/Insuficiência seja tratado conforme definido acima.
 */
async function calcularDesempenho() {
  // 📊 Hierarquia dos conceitos (quanto maior o número, melhor o desempenho)
  const conceitosOrdem = {
    E: 5,
    MB: 4,
    B: 3,
    R: 2,
    Suficiência: 2, // mesmo peso de R
    Insuficiência: 1,
    "NA (Insuficiente)": 1,
    I: 1,
    NA: 0,
  };

  // 🧾 Coleta de dados
  const ensino = document.getElementById("linhaEnsino_Desempenho").value;
  const sexo = document.getElementById("sexo_Desempenho").value;
  const idade = document.getElementById("idade_Desempenho").value;
  const corrida = Number(document.getElementById("corrida").value) || null;
  const flexaoBracos =
    Number(document.getElementById("flexaoBracos").value) || null;
  const abdominal = Number(document.getElementById("abdominal").value) || null;

  const barraFixaInput = document.getElementById("barraFixa").value;
  const barraFixa = Number(barraFixaInput.replace(/[^0-9]/g, "")) || null;

  const resultadoDiv = document.getElementById("resultado_Desempenho");
  resultadoDiv.innerHTML = "<p>Carregando...</p>";

  // 🚫 Validação
  if (!ensino || !sexo || !idade) {
    resultadoDiv.innerHTML =
      "<p style='color:red;'>Selecione a Linha de Ensino, o Sexo e digite sua Idade.</p>";
    return;
  }

  try {
    const dados = await fetchDadosTAF();
    const testes = dados.tabelas_de_aptidao[ensino]?.[sexo];

    if (!testes) {
      resultadoDiv.innerHTML =
        "<p>Nenhum dado de TAF encontrado para esta combinação.</p>";
      return;
    }

    const idadeNum = Number(idade);
    let resultadosFinais = `<h2>Seu Desempenho (${idade} anos)</h2>`;
    let piorConceitoValor = 6; // inicia com o melhor possível
    let piorConceitoNome = "";

    // 🔁 Itera sobre os testes
    testes.forEach((teste) => {
      const requisitos = teste.requisitos_por_idade;
      const faixaEtaria = encontrarFaixaEtaria(idadeNum, requisitos);
      const faixa = requisitos[faixaEtaria];
      if (!faixa) return;

      let valorUsuario = null;
      let tipoTeste = teste.teste.toLowerCase();
      let valorInputOriginal = "";

      if (tipoTeste.includes("corrida")) {
        valorUsuario = corrida;
        valorInputOriginal = corrida;
      } else if (tipoTeste.includes("flexão de braços")) {
        valorUsuario = flexaoBracos;
        valorInputOriginal = flexaoBracos;
      } else if (tipoTeste.includes("abdominal")) {
        valorUsuario = abdominal;
        valorInputOriginal = abdominal;
      } else if (tipoTeste.includes("barra fixa")) {
        valorUsuario = barraFixa;
        valorInputOriginal = barraFixaInput;
      } else return;

      if (valorUsuario === null) return;

      // 🎯 Calcula conceito
      let nota;
      // Caso especial: LEMB - feminino - >= 40 anos => sustentação (segundos)
      if (
        ensino === "LEMB" &&
        sexo === "feminino" &&
        idadeNum >= 40 &&
        tipoTeste.includes("barra fixa")
      ) {
        // Chamamos como "sustentação" para que a função trate Suficiência/Insuficiência
        nota = obterNota(valorUsuario, faixa, "sustentação");
      } else {
        // Para demais casos chamamos pelo tipo real (barra fixa incluída),
        // assim a lógica de mapear Suficiência para E/MB/B/R aplica-se.
        nota = obterNota(valorUsuario, faixa, tipoTeste);
      }

      // 🧮 Avalia conceito global (menor conceito = pior desempenho)
      const valorNota = conceitosOrdem[nota] || 0;
      if (valorNota > 0 && valorNota < piorConceitoValor) {
        piorConceitoValor = valorNota;
        piorConceitoNome = nota;
      }

      // 🧾 Exibe resultado individual
      resultadosFinais += `
        <div class="card">
          <h3>${teste.teste}</h3>
          <p><strong>Faixa Avaliada:</strong> ${faixaEtaria} | 
             <strong>Unidade:</strong> ${teste.unidade}</p>
          <p><strong>Seu Resultado:</strong> ${valorInputOriginal} ${
        teste.unidade
      }</p>
          <p><strong>Conceito:</strong> 
            <span style="font-weight: bold; color: ${
              valorNota <= 1 ? "red" : "green"
            };">${nota}</span>
          </p>
        </div>
      `;
    });

    // 🏁 Conceito global = pior conceito entre os testes
    const conceitoFinal = piorConceitoNome || "N/A (Preencha os testes)";
    const corFinal = piorConceitoValor <= 1 ? "red" : "green";

    resultadoDiv.innerHTML = `
      <h2 style='color: ${corFinal};'>
        Seu Conceito Global é: <span style="font-weight: bold;">${conceitoFinal}</span>
      </h2>
      ${resultadosFinais}
    `;
  } catch (erro) {
    console.error("Erro no cálculo de desempenho:", erro);
    resultadoDiv.innerHTML =
      "<p style='color:red;'>Erro inesperado ao calcular desempenho. Verifique a URL de dados.</p>";
  }
}
