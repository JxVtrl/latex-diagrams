import React, { useState } from "react";
import { KatexPreview } from "./components/KatexPreview";
import { TikzPreview } from "./components/TikzPreview";
import "./App.css";

const defaultExample = String.raw`
\[
\begin{aligned}
x &= 1+1\\
y &= 2+2
\end{aligned}
\]
`;

function App() {
  const [latexInput, setLatexInput] = useState<string>(defaultExample);

  // Detecta se o código contém TikZ
  const containsTikz = /\\begin\{tikzpicture\}/.test(latexInput);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLatexInput(text);
    } catch (err) {
      alert("Não consegui ler do clipboard (permissão do navegador).");
    }
  };

  const handleClear = () => setLatexInput("");

  return (
    <div className="app" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>LaTeX Live Preview</h1>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={handlePasteFromClipboard}>Colar</button>
          <button
            onClick={handleClear}
            style={{ backgroundColor: "#e53935", color: "white" }}
          >
            Limpar
          </button>
        </div>

        <textarea
          value={latexInput}
          onChange={(e) => setLatexInput(e.target.value)}
          rows={12}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: 14,
            borderRadius: 8,
            padding: 8,
            boxSizing: "border-box",
          }}
        />

        <h3 style={{ marginTop: 16 }}>
          Preview ({containsTikz ? "TikZJax" : "KaTeX"})
        </h3>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: containsTikz ? 0 : 8,
            minHeight: containsTikz ? 500 : 80,
            backgroundColor: "#fafafa",
            width: "100%",
            overflow: "auto",
          }}
        >
          {containsTikz ? (
            <TikzPreview code={latexInput} />
          ) : (
            <KatexPreview code={latexInput} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

