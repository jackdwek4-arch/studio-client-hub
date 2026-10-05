/** Tiny markdown renderer for proposals and contracts: headings, lists,
 *  paragraphs, bold. Enough for documents without pulling in a library. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className="prose-doc text-[15px] text-ink">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return lines.map((line, j) => {
          const key = `${i}-${j}`;
          if (line.startsWith("### ")) return <h3 key={key}>{inline(line.slice(4))}</h3>;
          if (line.startsWith("## ")) return <h2 key={key}>{inline(line.slice(3))}</h2>;
          if (line.startsWith("# ")) return <h2 key={key}>{inline(line.slice(2))}</h2>;
          return <p key={key}>{inline(line)}</p>;
        });
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
  );
}
