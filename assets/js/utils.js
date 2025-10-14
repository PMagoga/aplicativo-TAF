/**
 * Funções utilitárias para carregamento de dados e lógica de faixa etária.
 */

// Exportação nomeada
export async function fetchDadosTAF() {
  const url =
    "https://raw.githubusercontent.com/PMagoga/aplicativo-TAF/refs/heads/main/resultados.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const dados = await response.json();
    return dados;
  } catch (error) {
    console.error("Falha ao carregar dados do TAF:", error);
    // Retorna uma estrutura vazia para evitar quebra total do código
    return { tabelas_de_aptidao: {} };
  }
}

/**
 * Encontra a chave da faixa etária correta no JSON
 * (Ex: 20 anos retorna '18-21').
 * @param {number} idade - A idade digitada pelo usuário.
 * @param {object} requisitosPorIdade - O objeto 'requisitos_por_idade' do teste específico.
 * @returns {string | null} A string da faixa etária (Ex: '18-21') ou null se não for encontrada.
 */
// Exportação nomeada
export function encontrarFaixaEtaria(idade, requisitosPorIdade) {
  // Parâmetro CORRETO
  const idadeNum = Number(idade);

  // Variável CORRETA
  for (const faixaChave in requisitosPorIdade) {
    // Variável CORRETA
    if (requisitosPorIdade.hasOwnProperty(faixaChave)) {
      if (faixaChave.includes("-")) {
        const [minStr, maxStr] = faixaChave.split("-");
        const min = Number(minStr);
        const max = Number(maxStr);

        if (idadeNum >= min && idadeNum <= max) {
          return faixaChave;
        }
      }
    }
  }

  return null;
}
