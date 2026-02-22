import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";
import { fontFamily } from "./load-fonts";
import { IntroScene } from "./components/IntroScene";
import { OutroScene } from "./components/OutroScene";
import { HeaderBar } from "./components/HeaderBar";
import { RoundRow } from "./components/RoundRow";
import { FooterBar } from "./components/FooterBar";
import { AgentCard } from "./components/AgentCard";
import { ConsensusSection } from "./components/ConsensusSection";
import { ConvergedBanner } from "./components/ConvergedBanner";
import {
  agents,
  sections,
  round1Summary,
  round2Summary,
  round1Consensus,
  round2Consensus,
} from "./data/mock";

// ─── Timeline (630 frames @ 30fps = 21s) ────────────────
//
// Phase              Frames      Duration
// INTRO              0–119       4s
// CONNECTING         120–179     2s
// R1_THINKING        180–269     3s
// R1_COMPLETE        270–374     3.5s
// R2_THINKING        375–434     2s
// R2_COMPLETE        435–479     1.5s
// CONVERGED          480–539     2s
// OUTRO              540–629     3s

const O = 120; // offset — all original frame refs shifted by this

const BRAILLE = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

const allApprove = sections.map((s) => ({
  name: s,
  verdict: "APPROVE" as const,
}));

export const TwoferShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spinnerChar = BRAILLE[Math.floor(frame / 2.4) % BRAILLE.length];

  // ─── Phase booleans ───
  const isIntro = frame < O;
  const isOutro = frame >= 540;
  const isConnecting = frame >= O && frame < O + 60;
  const isR1Thinking = frame >= O + 60 && frame < O + 150;
  const isR1Complete = frame >= O + 150 && frame < O + 255;
  const isR2Thinking = frame >= O + 255 && frame < O + 315;
  const isR2Complete = frame >= O + 315 && frame < O + 360;
  const isConverged = frame >= O + 360 && frame < 540;
  const isDebateUI = !isIntro && !isOutro;

  // Current round number
  const round =
    frame < O + 60 ? 0 : frame < O + 255 ? 1 : 2;

  // Header status
  const headerStatus: "CONNECTING" | "DEBATING" | "COMPLETE" =
    isConnecting
      ? "CONNECTING"
      : isConverged || isOutro
        ? "COMPLETE"
        : "DEBATING";

  // Footer status
  const footerStatus =
    isConnecting
      ? "CONNECTING"
      : isConverged
        ? "COMPLETE"
        : "DEBATING";

  // ─── Debate UI opacity (fade in from intro, fade out to outro) ───
  const debateUIOpacity = interpolate(
    frame,
    [O - 1, O + 15, 530, 542],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Connecting center
  const connectingOpacity = interpolate(
    frame,
    [O, O + 12, O + 50, O + 60],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Agent panels (appear at R1 thinking)
  const agentPanelsOpacity = interpolate(
    frame,
    [O + 60, O + 75],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // R1 complete crossfade
  const r1CompleteOpacity = interpolate(
    frame,
    [O + 148, O + 155, O + 250, O + 257],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // R2 content
  const r2ContentOpacity = interpolate(
    frame,
    [O + 257, O + 265],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Consensus R1
  const consensusR1Opacity = interpolate(
    frame,
    [O + 165, O + 175, O + 250, O + 257],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Consensus R2
  const consensusR2Opacity = interpolate(
    frame,
    [O + 330, O + 340, O + 355, O + 362],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Converged banner
  const convergedOpacity = interpolate(
    frame,
    [O + 358, O + 368],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Agent R1 states
  const agentAStateR1 =
    frame < O + 110 ? "thinking" : frame < O + 145 ? "generating" : "complete";
  const agentBStateR1 =
    frame < O + 95 ? "thinking" : frame < O + 140 ? "generating" : "complete";

  // KB counters
  const kbA = Math.min(24, Math.floor((frame - (O + 110)) * 0.4));
  const kbB = Math.min(18, Math.floor((frame - (O + 95)) * 0.3));

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* ─── INTRO ─── */}
      {isIntro && (
        <Sequence durationInFrames={O} premountFor={0}>
          <IntroScene />
        </Sequence>
      )}

      {/* ─── OUTRO ─── */}
      {isOutro && (
        <Sequence from={540} layout="none" premountFor={10}>
          <OutroScene />
        </Sequence>
      )}

      {/* ─── DEBATE UI ─── */}
      {isDebateUI && (
        <AbsoluteFill style={{ opacity: debateUIOpacity, fontFamily }}>
          {/* Header */}
          <HeaderBar round={round} maxRounds={3} status={headerStatus} />

          {/* Round indicator */}
          {!isConnecting && (
            <div style={{ marginTop: 16, opacity: agentPanelsOpacity }}>
              <RoundRow current={round} max={3} />
            </div>
          )}

          {/* CONNECTING CENTER */}
          {isConnecting && (
            <div
              style={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                opacity: connectingOpacity,
              }}
            >
              <span
                style={{
                  color: theme.orange,
                  fontSize: 32,
                  fontFamily: "monospace",
                }}
              >
                {spinnerChar}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: theme.muted,
                }}
              >
                CONNECTING TO TWOFER
              </span>
            </div>
          )}

          {/* CONVERGED BANNER */}
          {isConverged && (
            <div style={{ marginTop: 16, opacity: convergedOpacity }}>
              <Sequence from={0} layout="none" premountFor={10}>
                <ConvergedBanner />
              </Sequence>
            </div>
          )}

          {/* AGENT PANELS */}
          {!isConnecting && (
            <div
              style={{
                display: "flex",
                gap: 16,
                padding: "16px 32px",
                opacity: agentPanelsOpacity,
                position: "relative",
              }}
            >
              {/* ROUND 1 LAYER */}
              {(isR1Thinking || isR1Complete) && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    width: "100%",
                    opacity: isR1Complete ? r1CompleteOpacity : 1,
                  }}
                >
                  <AgentCard
                    name={agents.a.name}
                    dotColor={agents.a.dotColor}
                    state={
                      isR1Complete
                        ? "complete"
                        : (agentAStateR1 as "thinking" | "generating")
                    }
                    summaryText={isR1Complete ? round1Summary.a : undefined}
                    sectionVerdicts={isR1Complete ? allApprove : undefined}
                    overallVerdict={isR1Complete ? "APPROVE" : undefined}
                    kbReceived={kbA}
                  />
                  <AgentCard
                    name={agents.b.name}
                    dotColor={agents.b.dotColor}
                    state={
                      isR1Complete
                        ? "complete"
                        : (agentBStateR1 as "thinking" | "generating")
                    }
                    summaryText={isR1Complete ? round1Summary.b : undefined}
                    sectionVerdicts={isR1Complete ? allApprove : undefined}
                    overallVerdict={isR1Complete ? "APPROVE" : undefined}
                    kbReceived={kbB}
                  />
                </div>
              )}

              {/* ROUND 2 + CONVERGED LAYER */}
              {(isR2Thinking || isR2Complete || isConverged) && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    width: "100%",
                    position: isR1Complete ? "absolute" : "relative",
                    left: isR1Complete ? 32 : 0,
                    right: isR1Complete ? 32 : 0,
                    opacity: r2ContentOpacity,
                  }}
                >
                  <AgentCard
                    name={agents.a.name}
                    dotColor={agents.a.dotColor}
                    state={
                      isR2Thinking && frame < O + 300 ? "thinking" : "complete"
                    }
                    summaryText={
                      frame >= O + 300 ? round2Summary.a : undefined
                    }
                    sectionVerdicts={
                      frame >= O + 300
                        ? sections.map((s) => ({
                            name: s,
                            verdict:
                              s === "Data Model" ||
                              s === "API Design" ||
                              s === "State Management" ||
                              s === "Security"
                                ? ("CHANGES" as const)
                                : ("APPROVE" as const),
                          }))
                        : undefined
                    }
                    overallVerdict={frame >= O + 300 ? "APPROVE" : undefined}
                    showChangeRequests={frame >= O + 300}
                  />
                  <AgentCard
                    name={agents.b.name}
                    dotColor={agents.b.dotColor}
                    state={
                      isR2Thinking && frame < O + 295 ? "thinking" : "complete"
                    }
                    summaryText={
                      frame >= O + 295 ? round2Summary.b : undefined
                    }
                    sectionVerdicts={
                      frame >= O + 295 ? allApprove : undefined
                    }
                    overallVerdict={frame >= O + 295 ? "APPROVE" : undefined}
                  />
                </div>
              )}
            </div>
          )}

          {/* CONSENSUS (R1) */}
          {isR1Complete && (
            <div style={{ padding: "0 32px", opacity: consensusR1Opacity }}>
              <Sequence from={0} layout="none" premountFor={10}>
                <ConsensusSection
                  agreed={round1Consensus.agreed}
                  disputed={round1Consensus.disputed}
                />
              </Sequence>
            </div>
          )}

          {/* CONSENSUS (R2) */}
          {(isR2Complete || isConverged) &&
            frame >= O + 325 &&
            frame < O + 365 && (
              <div style={{ padding: "0 32px", opacity: consensusR2Opacity }}>
                <Sequence from={0} layout="none" premountFor={10}>
                  <ConsensusSection
                    agreed={round2Consensus.agreed}
                    disputed={round2Consensus.disputed}
                  />
                </Sequence>
              </div>
            )}

          {/* Footer */}
          <FooterBar status={footerStatus} showExport={isConverged} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
