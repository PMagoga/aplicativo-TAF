import { fetchDadosTAF, encontrarFaixaEtaria } from "./utils.js";

document
  .getElementById("calcularDesempenho")
  .addEventListener("click", calcularDesempenho);

/**
 * Função utilitária que analisa o valor do usuário (resultado)
 * contra os limites de desempenho da tabela (requisitos) e retorna o conceito.
 * * @param {number} resultado - O valor do usuário (e.g., 2500 metros).
 * @param {object} requisitosFaixa - O objeto de requisitos para a faixa etária (e.g., { I: '≤ 2599', R: '2600-2799', ... }).
 * @param {string} tipoTeste - O tipo de teste (Corrida, Flexão, Abdominal, Barra).
 * @returns {string} O conceito alcançado (I, R, B, MB, E, Suficiência) ou 'NA (Insuficiente)'.
 */
function obterNota(resultado, requisitosFaixa, tipoTeste) {
  if (resultado === null) return "NA";

  // O loop processa na ordem em que aparecem no JSON (geralmente I -> E)
  for (const nota in requisitosFaixa) {
    const requisito = String(requisitosFaixa[nota]);
    // Remove tudo que não for número para obter o limite (3 de "<= 3", 4 de "4", 9 de "9")
    const limiteNumerico = Number(requisito.replace(/[^0-9]/g, ""));

    // 1. Caso de Suficiência
    if (nota === "Suficiência") {
      const valorSuficiencia = Number(requisito.replace(/[^0-9]/g, ""));
      if (resultado >= valorSuficiencia) {
        return "Suficiência";
      }
      return "Insuficiência";
    }

    // 2. Caso de 'Maior ou Igual a' (≥)
    if (requisito.includes("≥")) {
      if (resultado >= limiteNumerico) {
        return nota;
      }
    }

    // 3. Caso de Faixa (Min-Max)
    if (requisito.includes("-")) {
      const [minStr, maxStr] = requisito.split("-");
      const min = Number(minStr.replace(/[^0-9]/g, ""));
      const max = Number(maxStr.replace(/[^0-9]/g, ""));

      if (resultado >= min && resultado <= max) {
        return nota;
      }
    }

    // 4. CORREÇÃO: Caso de Valor Único sem Operadores (Ex: R: "4", E: "9")
    // Este bloco lida com conceitos que são definidos por um único número,
    // mas que não são I ou faixas.
    if (
      !requisito.includes("-") &&
      !requisito.includes("≤") &&
      !requisito.includes("≥")
    ) {
      // Se for R, só se encaixa se for EXATAMENTE aquele valor.
      if (nota === "R" && resultado === limiteNumerico) {
        return nota;
      }
      // Se for E, se encaixa se for MAIOR OU IGUAL (por ser o conceito máximo)
      if (nota === "E" && resultado >= limiteNumerico) {
        return nota;
      }
    }

    // 5. Caso de 'Menor ou Igual a' (≤) (Geralmente I)
    if (requisito.includes("≤")) {
      if (resultado <= limiteNumerico) {
        return nota;
      }
    }
  }

  // Se o resultado for maior que I, mas menor que o R mais baixo, ele é Insuficiente.
  return "NA (Insuficiente)";
}

/**
 * Função principal para calcular o desempenho do usuário, encontrando o pior índice global.
 */
async function calcularDesempenho() {
  // 1. Mapeamento de Conceitos (para determinar o 'pior' índice)
  const conceitosOrdem = {
    E: 5, // Excelente (Melhor)
    MB: 4,
    B: 3,
    R: 2, // Regular
    Suficiência: 2,
    Insuficiência: 1,
    "NA (Insuficiente)": 1,
    I: 1, // Insuficiente (Pior)
    NA: 0, // Não Avaliado
  };

  // 2. Coleta os valores
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

  // 3. Validação básica
  if (!ensino || !sexo || !idade) {
    resultadoDiv.innerHTML =
      "<p style='color:red;'>Selecione a Linha de Ensino, o Sexo e digite sua Idade.</p>";
    return;
  }

  // 4. Busca dos dados
  try {
    const dados = await fetchDadosTAF();
    const testes = dados.tabelas_de_aptidao[ensino]?.[sexo];

    if (!testes) {
      resultadoDiv.innerHTML =
        "<p>Nenhum dado de TAF encontrado para esta combinação.</p>";
      return;
    }

    const idadeNum = Number(idade);
    let resultadosFinais = "<h2>Seu Desempenho (" + idade + " anos)</h2>";

    // Rastreamento do Pior Conceito
    let piorConceitoValor = 6;
    let piorConceitoNome = "";

    // 5. Itera sobre os testes
    testes.forEach((teste) => {
      const requisitos = teste.requisitos_por_idade;
      const faixaEtaria = encontrarFaixaEtaria(idadeNum, requisitos);
      const faixa = requisitos[faixaEtaria];

      if (!faixa) return;

      let valorUsuario = null;
      let tipoTeste = teste.teste.toLowerCase();
      let valorInputOriginal = "";

      // Mapeia o valor de entrada
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
      } else {
        return;
      }

      if (valorUsuario === null) return;

      // 6. Calcula a nota
      const nota = obterNota(valorUsuario, faixa, tipoTeste);

      // Compara a nota atual com a pior nota registrada
      const valorNota = conceitosOrdem[nota] || 0;

      if (valorNota > 0 && valorNota < piorConceitoValor) {
        piorConceitoValor = valorNota;
        piorConceitoNome = nota;
      }

      // 7. Formata o resultado individual
      resultadosFinais += `
                <div class="card">
                    <h3>${teste.teste}</h3>
                    <p><strong>Faixa Avaliada:</strong> ${faixaEtaria} | <strong>Unidade:</strong> ${
        teste.unidade
      }</p>
                    <p><strong>Seu Resultado:</strong> ${valorInputOriginal} ${
        teste.unidade
      }</p>
                    <p><strong>Conceito:</strong> <span style="font-weight: bold; color: ${
                      valorNota <= 1 ? "red" : "green"
                    };">${nota}</span></p>
                </div>
            `;
    });

    // 8. Conclusão Final (Conceito Global)

    const conceitoFinal = piorConceitoNome || "N/A (Preencha os testes)";

    const corFinal = piorConceitoValor <= 1 ? "red" : "green";

    const statusFinal = `
            <h2 style='color: ${corFinal};'>
                Seu Conceito Global é: <span style="font-weight: bold;">${conceitoFinal}</span>
            </h2>
        `;

    resultadoDiv.innerHTML = statusFinal + resultadosFinais;
  } catch (erro) {
    console.error("Erro no cálculo de desempenho:", erro);
    resultadoDiv.innerHTML =
      "<p style='color:red;'>Erro inesperado ao calcular desempenho. Verifique a URL de dados.</p>";
  }
}
