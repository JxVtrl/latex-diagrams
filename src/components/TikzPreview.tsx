// src/components/TikzPreview.tsx
import { useMemo } from "react";

interface TikzPreviewProps {
  code: string;
}

/**
 * Normaliza automaticamente caracteres não-ASCII para ASCII/LaTeX.
 * Substitui acentos e símbolos unicode por suas versões compatíveis.
 */
function normalizeToAscii(text: string): string {
  // Se o texto já é ASCII puro, não altera nada
  if (!/[^\x00-\x7F]/.test(text)) {
    return text
  }

  // Primeiro remove marcas de acentuação mantendo o caractere base
  let normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Normaliza vírgulas unicode problemáticas para vírgula ASCII padrão
  // Garante que vírgulas sejam sempre preservadas corretamente
  // U+201A (single low-9 quotation mark), U+FF0C (fullwidth comma) → vírgula ASCII normal
  normalized = normalized.replace(/[\u201A\uFF0C]/g, ',')
  
  // Mapa de substituições: caractere unicode -> versão ASCII/LaTeX
  const replacements: Record<string, string> = {
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

  // Aplica todas as substituições
  for (const [unicode, ascii] of Object.entries(replacements)) {
    normalized = normalized.replace(new RegExp(unicode, 'g'), ascii);
  }

  return normalized;
}

/**
 * Corrige vírgulas dentro de expressões matemáticas para renderizar corretamente no TikZJax
 * Substitui vírgulas por \text{,} para evitar o bug do "c elevado"
 */
function fixCommasInMath(text: string): string {
  // Substitui vírgulas dentro de expressões matemáticas ($...$) por \text{,}
  // Isso força a vírgula a ser renderizada como texto, não como símbolo matemático
  return text.replace(/\$([^$]+)\$/g, (_match, content) => {
    // Substitui vírgulas que estão entre termos matemáticos por \text{,}
    // Preserva a aparência visual mas corrige o bug do TikZJax
    const fixed = content.replace(/,/g, '\\text{,}');
    return `$${fixed}$`;
  });
}

export function TikzPreview({ code }: TikzPreviewProps) {
  const trimmed = code.trim();
  
  // Primeiro corrige vírgulas em modo matemático
  const fixedCommas = useMemo(() => fixCommasInMath(trimmed), [trimmed]);
  
  // Depois normaliza automaticamente caracteres não-ASCII
  const normalizedCode = useMemo(() => normalizeToAscii(fixedCommas), [fixedCommas]);

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

    // Escapa apenas </script para não quebrar a tag HTML
    const safeCode = normalizedCode.replace(/<\/script/gi, "<\\/script");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=50.0, user-scalable=yes">
          <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">
          <script src="https://tikzjax.com/v1/tikzjax.js"></script>
          <style>
            * {
              box-sizing: border-box;
            }
            html {
              width: 100%;
              height: 100%;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              touch-action: none;
            }
            /* Container do TikZJax com zoom e pan */
            .tikzjax-container {
              width: 100%;
              height: 100%;
              position: relative;
              overflow: hidden;
              cursor: grab;
              background: #fff;
            }
            .tikzjax-container.dragging {
              cursor: grabbing;
            }
            .tikzjax {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
              transform-origin: center center;
              transition: transform 0.1s ease-out;
            }
            /* SVG responsivo */
            svg {
              max-width: 100%;
              max-height: 100%;
              width: auto;
              height: auto;
              display: block;
            }
            /* Controles de zoom */
            .zoom-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .zoom-btn {
              width: 40px;
              height: 40px;
              border: 1px solid #ccc;
              background: white;
              border-radius: 4px;
              cursor: pointer;
              font-size: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              user-select: none;
            }
            .zoom-btn:hover {
              background: #f0f0f0;
            }
            .zoom-btn:active {
              background: #e0e0e0;
            }
            .zoom-reset {
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="tikzjax-container" id="tikzContainer">
            <div class="tikzjax" id="tikzContent">
              <script type="text/tikz">
${safeCode}
              </script>
            </div>
            <div class="zoom-controls">
              <button class="zoom-btn" id="zoomIn">+</button>
              <button class="zoom-btn zoom-reset" id="zoomReset">⌂</button>
              <button class="zoom-btn" id="zoomOut">−</button>
            </div>
          </div>
          <script>
            (function() {
              const container = document.getElementById('tikzContainer');
              const content = document.getElementById('tikzContent');
              const zoomInBtn = document.getElementById('zoomIn');
              const zoomOutBtn = document.getElementById('zoomOut');
              const zoomResetBtn = document.getElementById('zoomReset');
              
              let scale = 1;
              let panX = 0;
              let panY = 0;
              let isDragging = false;
              let startX = 0;
              let startY = 0;
              let startPanX = 0;
              let startPanY = 0;
              let hasFitToView = false;
              
              const minScale = 0.5;
              const maxScale = 50;
              
              function updateTransform() {
                content.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${scale})\`;
              }

              function fitToView() {
                const svg = content.querySelector('svg');
                if (!svg) return;

                // Temporariamente reseta transform para medir tamanho original
                content.style.transform = 'translate(0px, 0px) scale(1)';
                
                // Usa viewBox ou getBBox para obter dimensões reais do SVG
                let svgWidth, svgHeight;
                try {
                  const bbox = svg.getBBox();
                  svgWidth = bbox.width || svg.clientWidth || svg.getBoundingClientRect().width;
                  svgHeight = bbox.height || svg.clientHeight || svg.getBoundingClientRect().height;
                } catch (e) {
                  const svgRect = svg.getBoundingClientRect();
                  svgWidth = svgRect.width;
                  svgHeight = svgRect.height;
                }

                const containerRect = container.getBoundingClientRect();

                if (svgWidth === 0 || svgHeight === 0) {
                  updateTransform();
                  return;
                }

                const padding = 40; // margem reduzida para usar mais espaço
                const availableWidth = Math.max(100, containerRect.width - padding);
                const availableHeight = Math.max(100, containerRect.height - padding);
                const scaleX = availableWidth / svgWidth;
                const scaleY = availableHeight / svgHeight;

                // Usa 95% do espaço disponível e multiplica por 1.5 para deixar o diagrama bem maior
                const targetScale = Math.min(scaleX, scaleY) * 0.95 * 1.5;
                
                // Garante um tamanho mínimo maior (mínimo 1.5x)
                scale = Math.max(1.5, Math.min(maxScale, targetScale));
                
                // O content já está centralizado com flex, então panX e panY devem ser 0
                // O transform-origin é center center, então o scale mantém o centro no lugar
                // Mas precisamos garantir que o SVG esteja realmente centralizado
                panX = 0;
                panY = 0;
                
                updateTransform();
                hasFitToView = true;
              }
              
              function zoom(factor, centerX, centerY) {
                const oldScale = scale;
                scale = Math.max(minScale, Math.min(maxScale, scale * factor));
                
                if (centerX !== undefined && centerY !== undefined) {
                  const rect = container.getBoundingClientRect();
                  const x = centerX - rect.left;
                  const y = centerY - rect.top;
                  
                  panX = x - (x - panX) * (scale / oldScale);
                  panY = y - (y - panY) * (scale / oldScale);
                }
                
                updateTransform();
              }
              
              function resetZoom() {
                hasFitToView = false;
                fitToView();
              }
              
              // Zoom com scroll
              container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const factor = e.deltaY > 0 ? 0.9 : 1.1;
                zoom(factor, e.clientX, e.clientY);
              }, { passive: false });
              
              // Pan com mouse
              container.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                  isDragging = true;
                  container.classList.add('dragging');
                  startX = e.clientX;
                  startY = e.clientY;
                  startPanX = panX;
                  startPanY = panY;
                }
              });
              
              document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                  panX = startPanX + (e.clientX - startX);
                  panY = startPanY + (e.clientY - startY);
                  updateTransform();
                }
              });
              
              document.addEventListener('mouseup', () => {
                isDragging = false;
                container.classList.remove('dragging');
              });
              
              // Touch events para pinch zoom e pan
              let lastTouchDistance = 0;
              let lastTouchCenter = { x: 0, y: 0 };
              
              container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                  isDragging = true;
                  startX = e.touches[0].clientX;
                  startY = e.touches[0].clientY;
                  startPanX = panX;
                  startPanY = panY;
                } else if (e.touches.length === 2) {
                  const touch1 = e.touches[0];
                  const touch2 = e.touches[1];
                  lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                  );
                  lastTouchCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                  };
                }
              }, { passive: false });
              
              container.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length === 1 && isDragging) {
                  panX = startPanX + (e.touches[0].clientX - startX);
                  panY = startPanY + (e.touches[0].clientY - startY);
                  updateTransform();
                } else if (e.touches.length === 2) {
                  const touch1 = e.touches[0];
                  const touch2 = e.touches[1];
                  const distance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                  );
                  
                  if (lastTouchDistance > 0) {
                    const factor = distance / lastTouchDistance;
                    zoom(factor, lastTouchCenter.x, lastTouchCenter.y);
                  }
                  
                  lastTouchDistance = distance;
                  lastTouchCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                  };
                }
              }, { passive: false });
              
              container.addEventListener('touchend', () => {
                isDragging = false;
                lastTouchDistance = 0;
              });
              
              // Botões de zoom
              zoomInBtn.addEventListener('click', () => zoom(1.2));
              zoomOutBtn.addEventListener('click', () => zoom(0.8));
              zoomResetBtn.addEventListener('click', resetZoom);
              
              // Aguarda o SVG ser renderizado e ter dimensões válidas
              const checkSVG = setInterval(() => {
                const svg = content.querySelector('svg');
                if (svg) {
                  try {
                    const bbox = svg.getBBox();
                    // Verifica se o SVG tem dimensões válidas
                    if (bbox.width > 0 && bbox.height > 0) {
                      clearInterval(checkSVG);
                      // Pequeno delay para garantir que o SVG está totalmente renderizado
                      setTimeout(() => {
                        if (!hasFitToView) {
                          fitToView();
                        } else {
                          updateTransform();
                        }
                      }, 50);
                    }
                  } catch (e) {
                    // Se getBBox falhar, tenta com getBoundingClientRect
                    const rect = svg.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                      clearInterval(checkSVG);
                      setTimeout(() => {
                        if (!hasFitToView) {
                          fitToView();
                        } else {
                          updateTransform();
                        }
                      }, 50);
                    }
                  }
                }
              }, 100);
              
              setTimeout(() => clearInterval(checkSVG), 5000);
            })();
          </script>
        </body>
      </html>
    `;
  }, [normalizedCode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <iframe
        title="TikZ Preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          height: "100%",
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

