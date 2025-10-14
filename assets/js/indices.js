import { fetchDadosTAF, encontrarFaixaEtaria } from "./utils.js";

document
  .getElementById("mostrarIndices")
  .addEventListener("click", async () => {
    // 1. Coleta os valores usando os NOVOS IDs
    const ensino = document.getElementById("linhaEnsino_Indices").value;
    const sexo = document.getElementById("sexo_Indices").value;
    // Agora coleta a idade EXATA digitada
    const idade = document.getElementById("idade_Indices").value;
    const resultado = document.getElementById("resultado_Indices");

    resultado.innerHTML = "<p>Carregando...</p>";

    // 2. Validação básica
    if (!ensino || !sexo || !idade) {
      resultado.innerHTML =
        "<p style='color:red;'>Selecione a Linha de Ensino, o Sexo e digite sua Idade.</p>";
      return;
    }

    try {
      const dados = await fetchDadosTAF();
      const testes = dados.tabelas_de_aptidao[ensino]?.[sexo];

      if (!testes) {
        resultado.innerHTML =
          "<p>Nenhum dado encontrado para esta combinação.</p>";
        return;
      }

      const idadeNum = Number(idade);
      let html = `<h2>Índices TAF para ${ensino} - ${sexo} (${idadeNum} anos)</h2>`;
      let dadosEncontrados = false;

      // 3. Itera sobre os testes e exibe a tabela
      testes.forEach((teste) => {
        const requisitos = teste.requisitos_por_idade;

        // Encontra a faixa etária CORRETA para este teste específico,
        // usando a função que criamos!
        const faixaEtaria = encontrarFaixaEtaria(idadeNum, requisitos);
        const faixa = requisitos[faixaEtaria];

        if (!faixa) {
          // Pula este teste se a idade não se encaixa em nenhuma faixa do teste (ex: testes de Oficiais com idade limite)
          return;
        }

        dadosEncontrados = true;

        // Cria o cabeçalho da tabela (I, R, B, MB, E ou Suficiência)
        const headers = Object.keys(faixa)
          .map((k) => `<th>${k}</th>`)
          .join("");

        // Cria as células da tabela (os valores de desempenho)
        const values = Object.values(faixa)
          .map((v) => `<td>${v}</td>`)
          .join("");

        html += `
                    <div class="card">
                        <h3>${teste.teste}</h3>
                        <p><strong>Faixa Avaliada:</strong> ${faixaEtaria} | <strong>Unidade:</strong> ${teste.unidade}</p>
                        <table>
                            <thead>
                                <tr>${headers}</tr>
                            </thead>
                            <tbody>
                                <tr>${values}</tr>
                            </tbody>
                        </table>
                    </div>
                `;
      });

      // 4. Exibe o resultado ou uma mensagem de aviso
      resultado.innerHTML = dadosEncontrados
        ? html
        : "<p>Nenhum índice disponível para a idade digitada (verifique se o TAF se aplica à sua idade).</p>";
    } catch (erro) {
      console.error("Erro ao carregar dados do TAF:", erro);
      resultado.innerHTML =
        "<p style='color:red;'>Erro ao carregar os dados. Verifique a conexão com a API.</p>";
    }
  });
