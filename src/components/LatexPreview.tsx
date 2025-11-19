import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './LatexPreview.css'

interface LatexPreviewProps {
  value: string
}

function LatexPreview({ value }: LatexPreviewProps) {
  const { html, error } = useMemo(() => {
    if (!value.trim()) {
      return { html: null, error: null }
    }

    try {
      // Processa o texto LaTeX e renderiza fórmulas
      const processedHtml = processLatex(value)
      return { html: processedHtml, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao renderizar LaTeX'
      return { html: null, error: errorMessage }
    }
  }, [value])

  if (!value.trim()) {
    return (
      <div className="preview preview-empty">
        <p>Digite ou cole código LaTeX acima para ver a pré-visualização...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="preview preview-error">
        <p className="error-message">Erro ao renderizar LaTeX: {error}</p>
      </div>
    )
  }

  return (
    <div className="preview">
      <div dangerouslySetInnerHTML={{ __html: html || '' }} />
    </div>
  )
}

function processLatex(text: string): string {
  // Escapa HTML para segurança
  const escapeHtml = (str: string) => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  // Divide o texto em linhas para processar
  const lines = text.split('\n')
  const processedLines: string[] = []

  for (const line of lines) {
    let processedLine = line

    // Processa blocos \[...\] primeiro
    processedLine = processedLine.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
      try {
        return katex.renderToString(content.trim(), { displayMode: true, throwOnError: false })
      } catch {
        return `<span class="katex-error">${escapeHtml(match)}</span>`
      }
    })

    // Processa blocos $$...$$ e marca temporariamente para não conflitar com $...$
    const placeholder = '___DOLLAR_DOLLAR___'
    const dollarDollarMatches: string[] = []
    processedLine = processedLine.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
      try {
        const rendered = katex.renderToString(content.trim(), { displayMode: true, throwOnError: false })
        dollarDollarMatches.push(rendered)
        return placeholder
      } catch {
        dollarDollarMatches.push(`<span class="katex-error">${escapeHtml(match)}</span>`)
        return placeholder
      }
    })

    // Processa inline \(...\)
    processedLine = processedLine.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => {
      try {
        return katex.renderToString(content.trim(), { displayMode: false, throwOnError: false })
      } catch {
        return `<span class="katex-error">${escapeHtml(match)}</span>`
      }
    })
    
    // Agora processa $...$ inline (os $$ já foram protegidos)
    processedLine = processedLine.replace(/\$([^$\n]+?)\$/g, (match, content) => {
      try {
        return katex.renderToString(content.trim(), { displayMode: false, throwOnError: false })
      } catch {
        return `<span class="katex-error">${escapeHtml(match)}</span>`
      }
    })
    
    // Restaura os $$ processados
    let placeholderIndex = 0
    processedLine = processedLine.replace(new RegExp(placeholder, 'g'), () => {
      return dollarDollarMatches[placeholderIndex++] || ''
    })

    // Se a linha não contém LaTeX renderizado, escapa HTML normal
    if (!processedLine.includes('katex')) {
      processedLine = escapeHtml(processedLine)
    }

    processedLines.push(processedLine)
  }

  return processedLines.join('<br>')
}

export default LatexPreview

