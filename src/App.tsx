import { useState } from 'react'
import LatexPreview from './components/LatexPreview'
import './App.css'

const INITIAL_LATEX = `% Exemplo de LaTeX
E = mc^2

\\[
\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}
\\]`

function App() {
  const [latexInput, setLatexInput] = useState<string>(INITIAL_LATEX)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setLatexInput(text)
    } catch (err) {
      alert('Erro ao ler da área de transferência. Verifique se você deu permissão para acessar o clipboard.')
    }
  }

  const handleClear = () => {
    setLatexInput('')
  }

  return (
    <div className="app">
      <header>
        <h1>LaTeX Live Preview</h1>
      </header>
      
      <main className="container">
        <div className="controls">
          <button onClick={handlePaste} className="btn btn-paste">
            Colar
          </button>
          <button onClick={handleClear} className="btn btn-clear">
            Limpar
          </button>
        </div>

        <textarea
          className="latex-input"
          value={latexInput}
          onChange={(e) => setLatexInput(e.target.value)}
          placeholder="Digite ou cole seu código LaTeX aqui..."
        />

        <LatexPreview value={latexInput} />
      </main>
    </div>
  )
}

export default App

