import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

type ConsensusSectionProps = {
  agreed: string[];
  disputed: string[];
};

export const ConsensusSection: React.FC<ConsensusSectionProps> = ({
  agreed,
  disputed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  return (
    <div
      style={{
        opacity: entrance,
        transform: `translateY(${translateY}px)`,
        fontFamily,
      }}
    >
      {/* Section divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}>+</span>
        <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.muted,
          }}
        >
          CONSENSUS
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <span style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}>+</span>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: 32, padding: "0 8px" }}>
        {/* Agreed column */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: theme.agreed,
              }}
            >
              AGREED ({agreed.length})
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {agreed.map((name, i) => {
              const delay = i * 3;
              const itemOpacity = interpolate(
                frame,
                [delay + 5, delay + 15],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: itemOpacity,
                  }}
                >
                  <span
                    style={{
                      color: theme.agreed,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: theme.fg }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disputed column */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: theme.orange,
              }}
            >
              DISPUTED ({disputed.length})
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {disputed.map((name, i) => (
              <div
                key={name}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    color: theme.orange,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                >
                  ▸✕◂
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: theme.fg }}>
                  {name}
                </span>
              </div>
            ))}
            {disputed.length === 0 && (
              <span style={{ fontSize: 11, color: `${theme.muted}80` }}>
                No disputed sections
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
