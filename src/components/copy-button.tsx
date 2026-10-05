"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
