"use client";

import { useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";

interface ConsensusSection {
  title: string;
  agreed: boolean;
  agentContents: Record<string, string>;
  finalContent: string;
}

interface SpecPreviewProps {
  sections: ConsensusSection[];
}

export function SpecPreview({ sections }: SpecPreviewProps) {
  const [open, setOpen] = useState(false);
  const agreed = sections.filter((s) => s.agreed);

  if (agreed.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        {open ? (
          <CaretDown size={12} className="text-muted-foreground" />
        ) : (
          <CaretRight size={12} className="text-muted-foreground" />
        )}
        <span className="swiss-label">SPEC PREVIEW</span>
        <span className="text-xs text-muted-foreground">
          ({agreed.length} section{agreed.length !== 1 ? "s" : ""})
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-4 border border-border p-4">
          {agreed.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-sm font-bold text-primary">
                {section.title}
              </h3>
              <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">
                {section.finalContent || Object.values(section.agentContents)[0] || ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
