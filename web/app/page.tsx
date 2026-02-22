"use client";

import { useDebateStream } from "@/lib/ws-client";
import { Header } from "@/components/header";
import { AgentPanel } from "@/components/agent-panel";
import { ConsensusView } from "@/components/consensus-view";
import { DiffView } from "@/components/diff-view";
import { RefineInput } from "@/components/refine-input";
import { RoundIndicator } from "@/components/round-indicator";
import { SpecPreview } from "@/components/spec-preview";
import { GridMark, SectionDivider } from "@/components/grid-marks";
import { ConnectingAnimation, IdleAnimation, ConvergedAnimation } from "@/components/ascii-animations";
import { Export, Plugs, PlugsConnected } from "@phosphor-icons/react";

// Color palette for agents
const AGENT_COLORS = ["claude", "codex", "green", "purple"] as const;

export default function DebatePage() {
  const { state, sendMessage } = useDebateStream();

  const handleRefine = (text: string) => {
    sendMessage("refine", { text });
  };

  const handleExport = () => {
    window.open(`${window.location.origin}/spec`, "_blank");
  };

  const disputed = state.consensus.filter((s) => !s.agreed);
  const isIdle = state.connected && state.round === 0 && !state.completed;
  const isConnecting = !state.connected;

  const gridCols =
    state.agentNames.length <= 2
      ? "grid-cols-2"
      : state.agentNames.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header
        round={state.round}
        maxRounds={state.maxRounds}
        status={state.status}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">

          {/* Connecting state */}
          {isConnecting && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <ConnectingAnimation />
              <span className="swiss-label text-muted-foreground">
                CONNECTING TO TWOFER
              </span>
              <span className="text-xs text-muted-foreground">
                Start the CLI: node dist/cli/index.js &quot;your prompt&quot;
              </span>
            </div>
          )}

          {/* Idle state — connected but no debate yet */}
          {isIdle && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <IdleAnimation />
              <span className="swiss-label text-muted-foreground">
                AWAITING DEBATE
              </span>
            </div>
          )}

          {/* Active debate or completed */}
          {!isConnecting && !isIdle && (
            <>
              {/* Round indicator */}
              <div className="flex items-center justify-between">
                <RoundIndicator current={state.round} max={state.maxRounds} />
                <div className="flex items-center gap-2">
                  {state.connected ? (
                    <PlugsConnected size={14} className="text-agreed" />
                  ) : (
                    <Plugs size={14} className="text-muted-foreground" />
                  )}
                  <span className="swiss-label">
                    {state.connected ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>
              </div>

              {/* Converged celebration */}
              {state.completed && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <ConvergedAnimation />
                  {state.convergence?.reason && (
                    <span className="text-xs text-muted-foreground">
                      {state.convergence.reason}
                    </span>
                  )}
                </div>
              )}

              {/* Agent panels — dynamic grid */}
              <div className={`grid ${gridCols} gap-4`}>
                {state.agentNames.map((name, i) => {
                  const agent = state.agents[name];
                  const color = AGENT_COLORS[i % AGENT_COLORS.length];
                  return (
                    <AgentPanel
                      key={name}
                      name={name}
                      color={color}
                      text={agent?.text ?? ""}
                      thinking={agent?.thinking ?? ""}
                      streaming={agent?.streaming ?? false}
                      verdict={agent?.response?.overall_verdict}
                      response={agent?.response}
                    />
                  );
                })}
              </div>

              {/* Consensus */}
              {state.consensus.length > 0 && (
                <ConsensusView sections={state.consensus} />
              )}

              {/* Disputed diffs */}
              {disputed.length > 0 && (
                <div className="space-y-3">
                  <SectionDivider label="DISPUTES" />
                  {disputed.map((section) => (
                    <DiffView
                      key={section.title}
                      title={section.title}
                      agentContents={section.agentContents}
                    />
                  ))}
                </div>
              )}

              {/* Spec preview */}
              {state.consensus.length > 0 && (
                <SpecPreview sections={state.consensus} />
              )}

              {/* Refine input */}
              {state.completed && (
                <RefineInput onSubmit={handleRefine} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GridMark />
            <span className="swiss-label">
              STATUS: {state.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {state.completed && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <Export size={14} />
                EXPORT
              </button>
            )}
            <span className="text-xs text-muted-foreground">twofer v1.0</span>
            <GridMark />
          </div>
        </div>
      </footer>
    </div>
  );
}
