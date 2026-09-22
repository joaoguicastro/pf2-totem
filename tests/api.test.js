import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatCpf, identify, questionnaire, makeSubmission } from '../src/services/api.js'

test('CPF mantém o formato usado pelo cadastro do backend', () => {
  assert.equal(formatCpf('12345678901'), '123.456.789-01')
  assert.equal(formatCpf('123.456.789-0199'), '123.456.789-01')
})
test('questionário preserva grupos e respostas negativas, corrigindo as mesmas chaves do app', () => {
  const questions = [{ group: 'discriminadoresGerais', chave: 'ALERTA' }, { group: 'respostasFluxograma', chave: 'IRRADIA_BRANCO_MANDIBULA' }]
  assert.deepEqual(makeSubmission('DOR_TORACICA', questions, { 'discriminadoresGerais:ALERTA': false, 'respostasFluxograma:IRRADIA_BRANCO_MANDIBULA': true }), { sintomaPrincipal: 'DOR_TORACICA', discriminadoresGerais: { ALERTA: false }, respostasFluxograma: { IRRADIA_BRACO_MANDIBULA: true } })
  assert.throws(() => makeSubmission('DOR_TORACICA', questions, {}), /todas/)
})
test('consulta envia CPF formatado e rejeita resposta incompleta', async t => {
  let requested
  t.mock.method(globalThis, 'fetch', async url => { requested = url; return new Response(JSON.stringify({ nomePaciente: 'Paciente Teste', chamadosPendentes: [] })) })
  await identify('12345678901')
  assert.ok(requested.endsWith('/v1/totem/123.456.789-01/identificacao'))
  globalThis.fetch = async () => new Response('{}')
  await assert.rejects(identify('12345678901'), /validar/)
})
test('questionário vazio e paciente inexistente geram erros recuperáveis', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ discriminadoresGerais: [], perguntaFluxograma: [] })))
  await assert.rejects(questionnaire('FEBRE'), /Nenhuma pergunta/)
  globalThis.fetch = async () => new Response('', { status: 404 })
  await assert.rejects(identify('12345678901'), /Cadastro não encontrado/)
})
