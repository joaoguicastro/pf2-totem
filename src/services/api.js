export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export function formatCpf(value) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export async function request(path, signal) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(15000)]) })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Não foi possível conectar ao serviço. Confira a conexão e tente novamente.')
  }
  if (!response.ok) {
    if (response.status === 404) throw new Error('Cadastro não encontrado. Confira o CPF ou procure a recepção.')
    throw new Error('O serviço não conseguiu concluir a consulta. Tente novamente.')
  }
  try { return await response.json() } catch { throw new Error('O serviço retornou uma resposta inválida. Tente novamente.') }
}

export async function identify(cpf, signal) {
  const data = await request(`/v1/totem/${encodeURIComponent(formatCpf(cpf))}/identificacao`, signal)
  if (typeof data.nomePaciente !== 'string' || !Array.isArray(data.chamadosPendentes)) throw new Error('Não foi possível validar o cadastro retornado pelo serviço.')
  return data
}

export async function symptoms(signal) {
  const data = await request('/v1/sintoma', signal)
  if (!Array.isArray(data) || !data.length || data.some(item => !item.nome || !item.label)) throw new Error('Nenhum sintoma disponível. Tente novamente.')
  return data
}

export async function questionnaire(symptom, signal) {
  const data = await request(`/v1/sintoma/${encodeURIComponent(symptom)}/perguntas`, signal)
  if (!Array.isArray(data.discriminadoresGerais) || !Array.isArray(data.perguntaFluxograma)) throw new Error('Questionário indisponível. Tente novamente.')
  const questions = [
    ...data.discriminadoresGerais.map(q => ({ ...q, group: 'discriminadoresGerais' })),
    ...data.perguntaFluxograma.map(q => ({ ...q, group: 'respostasFluxograma' })),
  ]
  if (!questions.length || questions.some(q => !q.chave || !q.texto)) throw new Error('Nenhuma pergunta disponível. Tente novamente.')
  return questions
}

export function makeSubmission(symptom, questions, answers) {
  const aliases = { IRRADIA_BRANCO_MANDIBULA: 'IRRADIA_BRACO_MANDIBULA', NAUSE_VOMITO_FORTE: 'NAUSEA_VOMITO_FORTE', LEVE_MELHORA_REPOPUSO: 'LEVE_MELHORA_REPOUSO' }
  const result = { sintomaPrincipal: symptom, discriminadoresGerais: {}, respostasFluxograma: {} }
  for (const question of questions) {
    const value = answers[`${question.group}:${question.chave}`]
    if (typeof value !== 'boolean') throw new Error('Responda todas as perguntas para continuar.')
    result[question.group][aliases[question.chave] || question.chave] = value
  }
  return result
}
