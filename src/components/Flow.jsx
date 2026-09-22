import { useEffect, useRef, useState } from 'react'
import { formatCpf, identify, symptoms, questionnaire, makeSubmission } from '../services/api'

function useResource(loader) {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    loader(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false })
    }).catch(error => { if (!controller.signal.aborted) setState({ error: error.message, loading: false }) })
    return () => controller.abort()
  }, [loader, attempt])
  return { ...state, retry: () => { setState({ loading: true }); setAttempt(n => n + 1) } }
}

function ResourceState({ resource }) {
  return resource.loading ? <p role="status" className="loading">Carregando…</p> : <div className="error-box" role="alert"><p>{resource.error}</p><button className="secondary" onClick={resource.retry}>Tentar novamente</button></div>
}

function Cpf({ mode, onFound, onNew }) {
  const [cpf, setCpf] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])
  async function submit(event) {
    event.preventDefault()
    if (pending.current || cpf.replace(/\D/g, '').length !== 11) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true); setError(''); setMissing(false)
    try {
      const patient = await identify(cpf, controller.signal)
      if (controller.signal.aborted) return
      if (mode === 'app' && !patient.chamadosPendentes.length) {
        setMissing(true)
        setError('Não encontramos uma avaliação pendente feita pelo app. Você pode iniciar uma avaliação aqui no totem.')
      } else onFound(patient)
    } catch (err) { if (!controller.signal.aborted) setError(err.message) }
    finally { if (!controller.signal.aborted) { setBusy(false); pending.current = null } }
  }
  return <>
    <h1>Digite seu CPF</h1>
    <p className="instructions">{mode === 'app' ? 'Vamos localizar seu cadastro e sua avaliação feita pelo app.' : 'Vamos localizar seu cadastro para começar o questionário.'}</p>
    <form onSubmit={submit} className="cpf-form">
      <label htmlFor="cpf">CPF do paciente</label>
      <input id="cpf" autoFocus inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} disabled={busy} onChange={e => { setCpf(formatCpf(e.target.value)); setError(''); setMissing(false) }} aria-describedby={error ? 'cpf-error' : undefined} />
      <div className="keypad" aria-label="Teclado numérico">
        {['1','2','3','4','5','6','7','8','9','Limpar','0','Apagar'].map(key => <button type="button" disabled={busy} key={key} onClick={() => { setError(''); setMissing(false); setCpf(value => formatCpf(key === 'Limpar' ? '' : key === 'Apagar' ? value.replace(/\D/g, '').slice(0,-1) : value + key)) }}>{key}</button>)}
      </div>
      {error && <p id="cpf-error" className="error-box" role="alert">{error}</p>}
      {missing && <button type="button" className="secondary" onClick={onNew}>Iniciar avaliação no totem</button>}
      <button className="primary" disabled={busy || cpf.replace(/\D/g, '').length !== 11}>{busy ? 'Buscando paciente…' : 'Buscar paciente'}</button>
    </form>
  </>
}

function Symptoms({ onSelect }) {
  const resource = useResource(symptoms)
  return <><h1>O que você está sentindo?</h1><p className="instructions">Escolha o sintoma principal para iniciar sua avaliação.</p>
    {!resource.data ? <ResourceState resource={resource} /> : <div className="options">{resource.data.map(symptom => <button className="option" key={symptom.nome} onClick={() => onSelect(symptom)}><span className="option-icon" aria-hidden="true">✚</span><strong>{symptom.label}</strong><span className="chevron" aria-hidden="true">›</span></button>)}</div>}
  </>
}

function Questionnaire({ symptom, onComplete, onBack }) {
  const [loader] = useState(() => signal => questionnaire(symptom.nome, signal))
  const resource = useResource(loader)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const question = resource.data?.[index]
  const key = question && `${question.group}:${question.chave}`
  const title = useRef(null)
  useEffect(() => { title.current?.focus() }, [index, resource.data])
  if (!resource.data) return <><h1>Questionário</h1><ResourceState resource={resource} /><button className="back-button" onClick={onBack}>← Voltar aos sintomas</button></>
  return <>
    <div className="question-meta"><span>{question.group === 'discriminadoresGerais' ? 'Sinais gerais de alerta' : symptom.label}</span><span>{index + 1} de {resource.data.length}</span></div>
    <progress max={resource.data.length} value={index + 1} aria-label="Progresso do questionário" />
    <h1 ref={title} tabIndex={-1} className="question-title">{question.texto}</h1>
    <p className="instructions">Selecione uma resposta para continuar.</p>
    <div className="answers" role="group" aria-label="Sua resposta">
      {[true, false].map(value => <button key={String(value)} className={`answer ${answers[key] === value ? 'selected' : ''}`} aria-pressed={answers[key] === value} onClick={() => setAnswers(current => ({ ...current, [key]: value }))}>{value ? 'Sim' : 'Não'}<span aria-hidden="true">{answers[key] === value ? '✓' : '○'}</span></button>)}
    </div>
    <div className="actions"><button className="primary" disabled={typeof answers[key] !== 'boolean'} onClick={() => index === resource.data.length - 1 ? onComplete(makeSubmission(symptom.nome, resource.data, answers)) : setIndex(i => i + 1)}>{index === resource.data.length - 1 ? 'Concluir questionário' : 'Continuar'}</button><button className="back-button" onClick={() => index ? setIndex(i => i - 1) : onBack()}>← Voltar</button></div>
  </>
}

const measurements = [
  { label: 'Oximetria', icon: '🫁', title: 'Vamos simular a leitura do oxímetro', description: 'Nesta demonstração, a saturação e os batimentos são preenchidos automaticamente.', result: '98% SpO₂  ·  76 bpm', values: { saturacao: 98, frequenciaCardiaca: 76 } },
  { label: 'Pressão', icon: '🩸', title: 'Vamos simular a pressão arterial', description: 'Aguarde a conclusão da leitura demonstrativa.', result: '120 / 80 mmHg', values: { pressaoSistolica: 120, pressaoDiastolica: 80 } },
  { label: 'Temp.', icon: '🌡️', title: 'Vamos simular a temperatura', description: 'Nenhum sensor físico está conectado nesta versão.', result: '36,5 °C', values: { temperatura: 36.5 } },
  { label: 'Peso', icon: '⚖️', title: 'Vamos simular a pesagem', description: 'O peso exibido é um valor fictício para demonstração.', result: '70,0 kg', values: { peso: 70 } },
  { label: 'Altura', icon: '📏', title: 'Vamos simular a altura', description: 'Esta é a última etapa da coleta demonstrativa.', result: '1,70 m', values: { altura: 1.7 } },
]

function Vitals({ onComplete }) {
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [values, setValues] = useState({})
  const current = measurements[index]
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800)
    return () => clearTimeout(timer)
  }, [index])
  return <div className="vitals">
    <div className="simulation-badge">Demonstração · sinais vitais simulados</div>
    <ol className="vital-steps">{measurements.map((item, i) => <li key={item.label} className={i === index ? 'active' : ''} aria-current={i === index ? 'step' : undefined}><span>{i < index ? '✓' : item.icon}</span>{item.label}</li>)}</ol>
    <h1>{current.title}</h1><p className="instructions">{current.description}</p>
    <div className={`sensor ${ready ? 'ready' : ''}`} aria-hidden="true">{current.icon}</div>
    <div className="reading" role="status">{ready ? <><span className="check">✓</span><strong>{current.result}</strong></> : 'Simulando leitura…'}</div>
    <div className="actions"><button className="primary" disabled={!ready} onClick={() => {
      const next = { ...values, ...current.values }
      if (index === measurements.length - 1) onComplete(next)
      else { setValues(next); setReady(false); setIndex(i => i + 1) }
    }}>{index === measurements.length - 1 ? 'Gerar senha demonstrativa' : `Avançar para ${measurements[index + 1].label.toLowerCase()}`}</button></div>
  </div>
}

function Ticket({ ticket, patient, onExit }) {
  return <div className="ticket-screen"><div className="success-symbol" aria-hidden="true">✓</div><h1>Etapas concluídas, {patient.nomePaciente.split(' ')[0]}!</h1><p className="instructions">Sua senha demonstrativa foi gerada.</p><div className="ticket"><span>SENHA SIMULADA</span><strong>{ticket.code}</strong><span>{new Date(ticket.createdAt).toLocaleString('pt-BR')}</span></div><p className="simulation-badge">Esta senha não inclui você em uma fila real.</p><p className="instructions">Os sinais vitais são fictícios. A avaliação e as medições desta sessão não foram salvas no servidor.</p><button className="primary" onClick={onExit}>Concluir e voltar ao início</button></div>
}

export default function Flow({ onExit }) {
  const [screen, setScreen] = useState('identify')
  const [mode, setMode] = useState('app')
  const [patient, setPatient] = useState(null)
  const [call, setCall] = useState(null)
  const [symptom, setSymptom] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [cancel, setCancel] = useState(false)
  const content = useRef(null)
  const issued = useRef(false)
  useEffect(() => { content.current?.focus() }, [screen])
  const stage = ['identify','cpf','confirm'].includes(screen) ? 0 : ['symptoms','questionnaire'].includes(screen) ? 1 : screen === 'vitals' ? 2 : 3
  return <main className="identification">
    <header className="header"><div className="header-brand"><span>Med+Facil</span><span className="badge">TOTEM</span></div><ol className="steps" aria-label="Etapas do atendimento">{['Identificação','Triagem','Sinais vitais','Senha'].map((label, i) => <li key={label} aria-current={stage === i ? 'step' : undefined} className={stage > i ? 'completed' : ''}><span>{stage > i ? '✓' : i + 1}</span>{label}</li>)}</ol></header>
    <section className="identification-content flow-content" ref={content} tabIndex={-1} aria-label="Atendimento">
      {screen === 'identify' && <><h1>Como você quer se identificar?</h1><p className="instructions">Escolha uma das opções abaixo para continuar.</p><div className="options">{[['app','▤','Digitar CPF','Já fiz a avaliação pelo app. Continuar para os sinais vitais.'],['new','✚','Não fiz avaliação ainda','Responder ao questionário aqui no totem.']].map(([value,icon,title,description]) => <button className="option" key={value} onClick={() => { setMode(value); setScreen('cpf') }}><span className="option-icon" aria-hidden="true">{icon}</span><span className="option-copy"><strong>{title}</strong><span>{description}</span></span><span className="chevron" aria-hidden="true">›</span></button>)}</div></>}
      {screen === 'cpf' && <Cpf key={mode} mode={mode} onNew={() => setMode('new')} onFound={data => { setPatient(data); setCall(data.chamadosPendentes.length === 1 ? data.chamadosPendentes[0] : null); setScreen('confirm') }} />}
      {screen === 'confirm' && <><h1>Encontramos seu cadastro</h1><div className="patient-card"><span>Paciente</span><strong>{patient.nomePaciente}</strong></div><p className="instructions">Confira seu nome antes de continuar.</p>{mode === 'app' && patient.chamadosPendentes.length > 1 && <><h2>Qual avaliação deseja continuar?</h2><div className="options">{patient.chamadosPendentes.map(item => <button className={`option ${call?.chamadoId === item.chamadoId ? 'selected' : ''}`} aria-pressed={call?.chamadoId === item.chamadoId} key={item.chamadoId} onClick={() => setCall(item)}><span className="option-copy"><strong>{item.sintomaPrincipal.replaceAll('_',' ')}</strong><span>{new Date(item.dataCriacao).toLocaleString('pt-BR')}</span></span></button>)}</div></>}<div className="actions"><button className="primary" disabled={mode === 'app' && !call} onClick={() => setScreen(mode === 'app' ? 'vitals' : 'symptoms')}>Sim, sou eu. Continuar</button><button className="back-button" onClick={() => { setPatient(null); setCall(null); setScreen('cpf') }}>Não sou eu. Corrigir CPF</button></div></>}
      {screen === 'symptoms' && <Symptoms onSelect={value => { setSymptom(value); setScreen('questionnaire') }} />}
      {screen === 'questionnaire' && <Questionnaire symptom={symptom} onBack={() => setScreen('symptoms')} onComplete={value => { setSubmission(value); setScreen('vitals') }} />}
      {screen === 'vitals' && <Vitals onComplete={values => { if (issued.current) return; issued.current = true; setTicket({ code: `SIM-${crypto.randomUUID().slice(0,8).toUpperCase()}`, createdAt: new Date().toISOString(), values, submission, chamadoId: call?.chamadoId }); setScreen('ticket') }} />}
      {screen === 'ticket' && <Ticket ticket={ticket} patient={patient} onExit={onExit} />}
      {screen !== 'ticket' && <div className="session-actions">{screen === 'cpf' && <button className="back-button" onClick={() => setScreen('identify')}>← Voltar às opções</button>}<button className="back-button" onClick={() => screen === 'identify' ? onExit() : setCancel(true)}>{screen === 'identify' ? '← Voltar ao início' : 'Cancelar atendimento'}</button></div>}
    </section>
    {cancel && <CancelDialog onCancel={() => setCancel(false)} onExit={onExit} />}
  </main>
}

function CancelDialog({ onCancel, onExit }) {
  const dialog = useRef(null)
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close() }, [])
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onCancel() }} aria-labelledby="cancel-title"><h2 id="cancel-title">Cancelar atendimento?</h2><p>Os dados desta sessão serão descartados.</p><button className="primary" autoFocus onClick={onCancel}>Continuar atendimento</button><button className="secondary" onClick={onExit}>Sim, cancelar e sair</button></dialog>
}
