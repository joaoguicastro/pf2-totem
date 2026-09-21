import { useEffect, useRef, useState } from 'react'
import './App.css'

const unidade = 'UPA Dr. José Martins'
const opcoes = [
  ['▣', 'Escanear código do app', 'Continue a avaliação que você já começou pelo celular'],
  ['▤', 'Digitar CPF', 'Buscar seus dados no sistema da unidade'],
  ['✚', 'Não fiz avaliação pelo app', 'Iniciar a triagem agora, direto pelo totem'],
]

export default function App() {
  const [iniciado, setIniciado] = useState(false)
  const [aviso, setAviso] = useState('')
  const titulo = useRef(null)
  useEffect(() => { if (iniciado) titulo.current?.focus() }, [iniciado])

  if (!iniciado) return (
    <main className="home">
      <div className="home-content">
        <div className="brand-symbol">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 5 39 11c0 17-5 25-15 32C14 36 9 28 9 11L24 5Z" fill="currentColor" opacity=".3" />
            <path d="m24 8 12 5c0 14-4 21-12 27-8-6-12-13-12-27l12-5Z" stroke="currentColor" strokeWidth="2" />
            <path d="M24 10v27" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h1>Med+Facil</h1>
        <p className="subtitle">Totem de Autoatendimento</p>
        <p className="welcome">Bem-vindo(a) à {unidade}</p>
        <button className="start-button" onClick={() => setIniciado(true)}>
          <span className="status-dot" aria-hidden="true" />Toque na tela para iniciar
        </button>
      </div>
    </main>
  )

  return (
    <main className="identification">
      <header className="header">
        <div className="header-brand"><span>Med+Facil</span><span className="badge">TOTEM</span></div>
        <ol className="steps" aria-label="Etapas do atendimento">
          {['Identificação', 'Triagem', 'Sinais vitais', 'Senha'].map((step, index) => (
            <li key={step} aria-current={index === 0 ? 'step' : undefined}><span>{index + 1}</span>{step}</li>
          ))}
        </ol>
      </header>
      <section className="identification-content" aria-labelledby="identification-title">
        <h1 id="identification-title" ref={titulo} tabIndex={-1}>Como você quer se identificar?</h1>
        <p className="instructions">Escolha uma das opções abaixo para continuar.</p>
        <div className="options">
          {opcoes.map(([icon, title, description]) => (
            <button className="option" key={title} onClick={() => setAviso(`“${title}” estará disponível na próxima etapa do desenvolvimento.`)}>
              <span className="option-icon" aria-hidden="true">{icon}</span>
              <span className="option-copy"><strong>{title}</strong><span>{description}</span></span>
              <span className="chevron" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
        <p className="notice" role="status">{aviso}</p>
        <button className="back-button" onClick={() => { setAviso(''); setIniciado(false) }}>← Voltar ao início</button>
      </section>
    </main>
  )
}
