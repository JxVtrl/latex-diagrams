import React, { useMemo } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface KatexPreviewProps {
  code: string;
}

function normalizeLatex(input: string): string {
  let s = input.trim();

  // Remove delimitadores \[ ... \], $$ ... $$, \( ... \)
  // para que o BlockMath receba só o conteúdo interno.
  if (s.startsWith("\\[") && s.endsWith("\\]")) {
    s = s.slice(2, -2).trim();
  }
  if (s.startsWith("$$") && s.endsWith("$$")) {
    s = s.slice(2, -2).trim();
  }
  if (s.startsWith("\\(") && s.endsWith("\\)")) {
    s = s.slice(2, -2).trim();
  }

  return s;
}

export const KatexPreview: React.FC<KatexPreviewProps> = ({ code }) => {
  const trimmed = code.trim();

  if (!trimmed) {
    return <p>Digite LaTeX acima…</p>;
  }

  const math = useMemo(() => normalizeLatex(trimmed), [trimmed]);

  return (
    <div style={{ padding: "12px" }}>
      <BlockMath math={math} />
    </div>
  );
};

