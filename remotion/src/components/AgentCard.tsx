import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

const BRAILLE = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

type AgentState = "standby" | "thinking" | "generating" | "complete";

type SectionVerdict = {
  name: string;
  verdict: "APPROVE" | "CHANGES";
};

type AgentCardProps = {
  name: string;
  dotColor: string;
  state: AgentState;
  summaryText?: string;
  sectionVerdicts?: SectionVerdict[];
  overallVerdict?: "APPROVE" | "CHANGES";
  kbReceived?: number;
  showChangeRequests?: boolean;
};

export const AgentCard: React.FC<AgentCardProps> = ({
  name,
  dotColor,
  state,
  summaryText = "",
  sectionVerdicts = [],
  overallVerdict,
  kbReceived = 16,
  showChangeRequests = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spinnerChar = BRAILLE[Math.floor(frame / 2.4) % BRAILLE.length];

  // Status label
  const statusLabel =
    state === "thinking"
      ? "THINKING"
      : state === "generating"
        ? "RESPONDING"
        : null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.border}`,
        minHeight: 260,
        fontFamily,
      }}
    >
      {/* Card header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.02em",
              color: theme.white,
              textTransform: "uppercase",
            }}
          >
            {name}
          </span>

          {/* Spinner or dot */}
          {state === "thinking" || state === "generating" ? (
            <span style={{ color: theme.orange, fontSize: 13, fontFamily: "monospace" }}>
              {spinnerChar}
            </span>
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: dotColor,
                display: "inline-block",
              }}
            />
          )}

          {/* Status label */}
          {statusLabel && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: theme.muted,
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Overall verdict badge */}
        {overallVerdict && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: theme.agreed, fontSize: 11, fontWeight: 700 }}>
              ✓
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: theme.agreed,
                textTransform: "uppercase",
              }}
            >
              {overallVerdict}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
        {state === "thinking" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <span style={{ color: theme.orange, fontSize: 28, fontFamily: "monospace" }}>
              {spinnerChar}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: theme.muted,
                textTransform: "uppercase",
              }}
            >
              THINKING
            </span>
          </div>
        )}

        {state === "generating" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <span style={{ color: theme.orange, fontSize: 24, fontFamily: "monospace" }}>
              {spinnerChar}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: theme.muted,
                textTransform: "uppercase",
              }}
            >
              GENERATING SPECIFICATION
            </span>
            <span style={{ fontSize: 11, color: `${theme.muted}80` }}>
              {kbReceived}KB received
            </span>
          </div>
        )}

        {state === "complete" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Summary */}
            {summaryText && (
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: theme.fg,
                  margin: 0,
                }}
              >
                {summaryText}
              </p>
            )}

            {/* Sections list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sectionVerdicts.map((section, i) => {
                const entryOpacity = interpolate(
                  frame,
                  [i * 2, i * 2 + 8],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );

                const verdictColor =
                  section.verdict === "APPROVE" ? theme.agreed : theme.orange;

                return (
                  <div
                    key={section.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 4px",
                      opacity: entryOpacity,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: theme.muted, fontSize: 8 }}>▸</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.fg,
                        }}
                      >
                        {section.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: verdictColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {section.verdict}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Change requests indicator */}
            {showChangeRequests && (
              <div
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: theme.orange,
                    textTransform: "uppercase",
                  }}
                >
                  CHANGE REQUESTS
                </span>
              </div>
            )}
          </div>
        )}

        {state === "standby" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: `${theme.muted}50`,
                textTransform: "uppercase",
              }}
            >
              STANDBY
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
