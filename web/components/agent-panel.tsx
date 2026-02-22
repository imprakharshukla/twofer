"use client";

import { useState, useMemo } from "react";
import { CaretDown, CaretRight, Check, X, ArrowsClockwise } from "@phosphor-icons/react";
import { AsciiSpinner } from "./ascii-animations";

interface Section {
  title: string;
  content: string;
  verdict: string;
  reasoning: string;
}

interface AgentResponse {
  sections: Section[];
  overall_verdict: string;
  change_requests: string[];
  summary: string;
}

interface AgentPanelProps {
  name: string;
  color: string;
  text: string;
  thinking: string;
  streaming: boolean;
  verdict?: string;
  response?: AgentResponse | null;
}

const COLOR_MAP: Record<string, string> = {
  claude: "bg-claude",
  codex: "bg-codex",
  green: "bg-agreed",
  purple: "bg-purple-500",
};

/** Check if text looks like it's exploring/using tools (not the final JSON) */
function isExploringText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // If it starts with { or code fence, it's the JSON response
  if (t.startsWith("{") || t.startsWith("```")) return false;
  // If the text contains JSON (agent explored first, then started outputting JSON)
  if (t.includes("\n{") || t.includes("\n```")) return false;
  return true;
}

/** Extract a human-readable activity line from exploring text */
function getExploringActivity(text: string): string {
  const lines = text.trim().split("\n").filter(Boolean);
  // Return last meaningful line (most recent activity)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim().replace(/:+$/, "");
    if (line.length > 10 && line.length < 200) return line;
  }
  return "Analyzing codebase...";
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "approve") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-agreed">
        <Check size={12} weight="bold" />
        APPROVE
      </span>
    );
  }
  if (verdict === "reject") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-destructive">
        <X size={12} weight="bold" />
        REJECT
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange">
      <ArrowsClockwise size={12} weight="bold" />
      CHANGES
    </span>
  );
}

function SectionsList({ sections }: { sections: Section[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <div key={section.title}>
          <button
            onClick={() => setExpanded(expanded === section.title ? null : section.title)}
            className="flex w-full items-center gap-2 py-1.5 px-1 text-left hover:bg-secondary/30 rounded-sm"
          >
            {expanded === section.title ? (
              <CaretDown size={10} className="text-muted-foreground shrink-0" />
            ) : (
              <CaretRight size={10} className="text-muted-foreground shrink-0" />
            )}
            <span className="text-xs font-semibold text-foreground flex-1">{section.title}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              section.verdict === "approve" ? "text-agreed" :
              section.verdict === "reject" ? "text-destructive" : "text-orange"
            }`}>
              {section.verdict === "suggest_changes" ? "CHANGES" : section.verdict.toUpperCase()}
            </span>
          </button>
          {expanded === section.title && (
            <div className="pl-5 pr-2 pb-2">
              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {section.content.slice(0, 500)}{section.content.length > 500 ? "..." : ""}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AgentPanel({
  name,
  color,
  text,
  thinking,
  streaming,
  verdict,
  response,
}: AgentPanelProps) {
  const [showThinking, setShowThinking] = useState(false);
  const dotColor = COLOR_MAP[color] ?? "bg-orange";
  const hasThinking = thinking.length > 0;

  // Determine what phase the agent is in
  const isWaiting = streaming && text.length < 50;
  const isExploring = streaming && !isWaiting && isExploringText(text);
  const isGenerating = streaming && !isWaiting && !isExploring;
  const hasResponse = !!response;

  // Status label
  const statusLabel = useMemo(() => {
    if (!streaming && !hasResponse) return null;
    if (isWaiting) return "THINKING";
    if (isExploring) return "EXPLORING";
    if (streaming) return "RESPONDING";
    return null;
  }, [streaming, hasResponse, isWaiting, isExploring]);

  return (
    <div className="flex flex-col border border-border min-h-[280px]">
      {/* Agent header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight text-primary uppercase">
            {name}
          </span>
          {streaming ? (
            <AsciiSpinner className="text-orange text-sm" />
          ) : (
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          )}
          {statusLabel && (
            <span className="swiss-label text-muted-foreground">
              {statusLabel}
            </span>
          )}
        </div>
        {verdict && <VerdictBadge verdict={verdict} />}
      </div>

      {/* Thinking (collapsible) */}
      {hasThinking && (
        <div className="border-b border-border">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex w-full items-center gap-1 px-4 py-2 text-left hover:bg-secondary/50"
          >
            {showThinking ? (
              <CaretDown size={12} className="text-muted-foreground" />
            ) : (
              <CaretRight size={12} className="text-muted-foreground" />
            )}
            <span className="swiss-label">Thinking</span>
          </button>
          {showThinking && (
            <div className="thinking-content max-h-40 overflow-y-auto px-4 pb-3">
              {thinking}
            </div>
          )}
        </div>
      )}

      {/* Response */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Parsed response: show summary + expandable sections */}
        {hasResponse ? (
          <div className="space-y-3">
            {response.summary && (
              <p className="text-sm leading-relaxed text-foreground">
                {response.summary}
              </p>
            )}
            <SectionsList sections={response.sections} />
            {response.change_requests.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="swiss-label text-orange">CHANGE REQUESTS</span>
                <ul className="mt-1 space-y-1">
                  {response.change_requests.map((cr, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {cr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : isWaiting ? (
          /* Thinking / waiting for meaningful content */
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <AsciiSpinner className="text-orange text-4xl" />
            <span className="swiss-label text-muted-foreground">
              THINKING
            </span>
          </div>
        ) : isExploring ? (
          /* Exploring codebase state */
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <AsciiSpinner className="text-orange text-3xl" />
            <span className="swiss-label text-muted-foreground">
              EXPLORING CODEBASE
            </span>
            <p className="text-xs text-muted-foreground text-center max-w-[90%] line-clamp-2">
              {getExploringActivity(text)}
            </p>
          </div>
        ) : isGenerating ? (
          /* Streaming JSON response — show progress indicator */
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <AsciiSpinner className="text-orange text-3xl" />
            <span className="swiss-label text-muted-foreground">
              GENERATING SPECIFICATION
            </span>
            <span className="text-xs text-muted-foreground/50">
              {Math.round(text.length / 1024)}KB received
            </span>
          </div>
        ) : (
          /* Waiting for round to start */
          <div className="flex flex-col h-full items-center justify-center gap-3">
            <span className="swiss-label text-muted-foreground/50">STANDBY</span>
          </div>
        )}
      </div>
    </div>
  );
}
