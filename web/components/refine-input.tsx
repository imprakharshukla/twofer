"use client";

import { useState, type KeyboardEvent } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";

interface RefineInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function RefineInput({ onSubmit, disabled }: RefineInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 border border-border bg-secondary/30 px-4 py-3">
      <span className="swiss-label shrink-0 text-muted-foreground">
        REFINE
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Enter refinement request..."
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex items-center gap-1 bg-orange px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-30 hover:opacity-90 transition-opacity"
      >
        SEND
        <PaperPlaneRight size={12} weight="bold" />
      </button>
    </div>
  );
}
