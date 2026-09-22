import { useState } from 'react'
import Flow from './components/Flow'
import './App.css'

const unidade = 'UPA Dr. José Martins'

export default function App() {
  const [iniciado, setIniciado] = useState(false)
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

  return <Flow onExit={() => setIniciado(false)} />
}
