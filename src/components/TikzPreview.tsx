// src/components/TikzPreview.tsx
import React, { useMemo } from "react";

interface TikzPreviewProps {
  code: string;
}

/**
 * Detecta caracteres não-ASCII no código TikZ.
 * TikZJax usa btoa() que só aceita Latin1, então caracteres unicode
 * (acentos, símbolos como ε, →, ≥) causam erro.
 */
function hasNonAsciiChars(text: string): boolean {
  // Verifica se há caracteres fora do range ASCII (0-127)
  return /[^\x00-\x7F]/.test(text);
}

/**
 * Normaliza automaticamente caracteres não-ASCII para ASCII/LaTeX.
 * Substitui acentos e símbolos unicode por suas versões compatíveis.
 */
function normalizeToAscii(text: string): string {
  // Mapa de substituições: caractere unicode -> versão ASCII/LaTeX
  const replacements: Record<string, string> = {
    // Acentos e cedilha
    'ç': 'c',
    'Ç': 'C',
    'ã': 'a',
    'Ã': 'A',
    'á': 'a',
    'Á': 'A',
    'à': 'a',
    'À': 'A',
    'â': 'a',
    'Â': 'A',
    'é': 'e',
    'É': 'E',
    'ê': 'e',
    'Ê': 'E',
    'í': 'i',
    'Í': 'I',
    'ó': 'o',
    'Ó': 'O',
    'ô': 'o',
    'Ô': 'O',
    'õ': 'o',
    'Õ': 'O',
    'ú': 'u',
    'Ú': 'U',
    'ü': 'u',
    'Ü': 'U',
    'ñ': 'n',
    'Ñ': 'N',
    
    // Símbolos matemáticos comuns
    'ε': '\\varepsilon',
    '→': '\\to',
    '←': '\\leftarrow',
    '≥': '\\geq',
    '≤': '\\leq',
    '≠': '\\neq',
    '≈': '\\approx',
    '±': '\\pm',
    '×': '\\times',
    '÷': '\\div',
    '∞': '\\infty',
    '∑': '\\sum',
    '∏': '\\prod',
    '∫': '\\int',
    '√': '\\sqrt',
    'α': '\\alpha',
    'β': '\\beta',
    'γ': '\\gamma',
    'δ': '\\delta',
    'θ': '\\theta',
    'λ': '\\lambda',
    'μ': '\\mu',
    'π': '\\pi',
    'σ': '\\sigma',
    'φ': '\\phi',
    'ω': '\\omega',
    'Δ': '\\Delta',
    'Γ': '\\Gamma',
    'Λ': '\\Lambda',
    'Σ': '\\Sigma',
    'Ω': '\\Omega',
    'Φ': '\\Phi',
    'Ψ': '\\Psi',
    '∈': '\\in',
    '∉': '\\notin',
    '⊂': '\\subset',
    '⊃': '\\supset',
    '⊆': '\\subseteq',
    '⊇': '\\supseteq',
    '∪': '\\cup',
    '∩': '\\cap',
    '∅': '\\emptyset',
    '∧': '\\wedge',
    '∨': '\\vee',
    '¬': '\\neg',
    '∀': '\\forall',
    '∃': '\\exists',
    '⇒': '\\Rightarrow',
    '⇐': '\\Leftarrow',
    '⇔': '\\Leftrightarrow',
    '⊕': '\\oplus',
    '⊗': '\\otimes',
    '⊥': '\\perp',
    '∥': '\\parallel',
    '∠': '\\angle',
  };

  let normalized = text;
  
  // Aplica todas as substituições
  for (const [unicode, ascii] of Object.entries(replacements)) {
    normalized = normalized.replace(new RegExp(unicode, 'g'), ascii);
  }

  return normalized;
}

export function TikzPreview({ code }: TikzPreviewProps) {
  const trimmed = code.trim();
  const hasNonAscii = useMemo(() => hasNonAsciiChars(trimmed), [trimmed]);
  
  // Normaliza automaticamente caracteres não-ASCII
  const normalizedCode = useMemo(() => normalizeToAscii(trimmed), [trimmed]);
  const wasNormalized = useMemo(() => trimmed !== normalizedCode, [trimmed, normalizedCode]);

  const srcDoc = useMemo(() => {
    if (!normalizedCode) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: system-ui, sans-serif;
                font-size: 14px;
                color: #666;
                padding: 12px;
              }
            </style>
          </head>
          <body>
            Digite um código com <code>\\begin{tikzpicture}</code> para ver o diagrama aqui.
          </body>
        </html>
      `;
    }

    const safeCode = normalizedCode.replace(/<\/script/gi, "<\\/script");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">
          <script src="https://tikzjax.com/v1/tikzjax.js"></script>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              overflow-x: auto;
              overflow-y: auto;
            }
            /* Container do TikZJax - ocupa toda a largura */
            .tikzjax {
              width: 100%;
              min-height: 100%;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 20px;
            }
            /* Aumenta o tamanho do SVG renderizado pelo TikZJax */
            svg {
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
              transform: scale(1.8);
              transform-origin: center top;
            }
            /* Aumenta o tamanho da fonte dentro do SVG */
            svg text {
              font-size: 18px !important;
            }
            /* Garante que o SVG seja visível e grande */
            svg g {
              transform: scale(1);
            }
          </style>
        </head>
        <body>
          <div class="tikzjax">
            <script type="text/tikz">
${safeCode}
            </script>
          </div>
        </body>
      </html>
    `;
  }, [normalizedCode]);

  return (
    <div>
      {wasNormalized && (
        <div
          style={{
            padding: "12px",
            marginBottom: "8px",
            backgroundColor: "#d1ecf1",
            border: "1px solid #0c5460",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#0c5460",
          }}
        >
          <strong>ℹ️ Correção automática aplicada:</strong> Caracteres não-ASCII foram convertidos automaticamente para ASCII/LaTeX.
          <br />
          Exemplos: ç→c, ã→a, é→e, ó→o, ε→\varepsilon, →→\to, etc.
        </div>
      )}
      <iframe
        title="TikZ Preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          minHeight: "500px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          background: "#fff",
          display: "block",
        }}
      />
    </div>
  );
}

