import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

export const ConvergedBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Diamond merge: two ◇ approach from sides, become ◆
  const mergeProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 40,
  });

  const leftX = interpolate(mergeProgress, [0, 1], [-80, 0]);
  const rightX = interpolate(mergeProgress, [0, 1], [80, 0]);
  const isMerged = mergeProgress > 0.95;

  // "CONVERGED" label
  const labelOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "20px 0",
        fontFamily,
      }}
    >
      {/* Diamond animation */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!isMerged ? (
          <>
            <span
              style={{
                position: "absolute",
                fontSize: 22,
                color: theme.orange,
                fontFamily: "monospace",
                transform: `translateX(${leftX}px)`,
              }}
            >
              ◇
            </span>
            <span
              style={{
                position: "absolute",
                fontSize: 22,
                color: theme.fg,
                fontFamily: "monospace",
                transform: `translateX(${rightX}px)`,
              }}
            >
              ◇
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 24,
              color: theme.orange,
              fontFamily: "monospace",
            }}
          >
            ◆
          </span>
        )}
      </div>

      {/* CONVERGED label with dashes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: labelOpacity,
        }}
      >
        <span
          style={{ color: `${theme.muted}60`, fontSize: 11, fontFamily: "monospace" }}
        >
          ──
        </span>
        <span
          style={{
            color: theme.agreed,
            fontSize: 12,
            letterSpacing: "0.3em",
            fontFamily: "monospace",
          }}
        >
          CONVERGED
        </span>
        <span
          style={{ color: `${theme.muted}60`, fontSize: 11, fontFamily: "monospace" }}
        >
          ──
        </span>
      </div>

      {/* Subtitle */}
      <span
        style={{
          fontSize: 11,
          color: theme.muted,
          opacity: subtitleOpacity,
        }}
      >
        All agents approved for 2 consecutive rounds
      </span>
    </div>
  );
};
