import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Line 1: "One AI. One perspective."
  const line1Opacity = interpolate(frame, [0, 20, 100, 119], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 20], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Line 2: "One unchallenged spec."
  const line2Opacity = interpolate(frame, [25, 45, 100, 119], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [25, 45], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Orange horizontal rule — grows from center
  const ruleWidth = interpolate(frame, [50, 72], [0, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const ruleOpacity = interpolate(frame, [50, 60, 100, 119], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 3: "What if your architecture was debated before you built it?"
  const line3Opacity = interpolate(frame, [65, 85, 100, 119], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line3Y = interpolate(frame, [65, 85], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      {/* Corner grid marks */}
      {[
        { top: 10, left: 10 },
        { top: 10, right: 10 },
        { bottom: 10, left: 10 },
        { bottom: 10, right: 10 },
      ].map((pos, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            ...pos,
            color: theme.muted,
            fontSize: 10,
            opacity: 0.4,
          }}
        >
          +
        </span>
      ))}

      {/* Center text stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: 30,
            fontWeight: 700,
            color: theme.white,
            letterSpacing: "-0.01em",
          }}
        >
          One AI. One perspective.
        </div>

        {/* Line 2 */}
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            fontSize: 19,
            fontWeight: 500,
            color: theme.muted,
          }}
        >
          One unchallenged spec.
        </div>

        {/* Orange rule */}
        <div
          style={{
            width: ruleWidth,
            height: 2,
            backgroundColor: theme.orange,
            opacity: ruleOpacity,
            marginTop: 6,
            marginBottom: 6,
          }}
        />

        {/* Line 3 */}
        <div
          style={{
            opacity: line3Opacity,
            transform: `translateY(${line3Y}px)`,
            fontSize: 16,
            fontWeight: 500,
            fontStyle: "italic",
            color: theme.orange,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          What if your architecture was debated before you built it?
        </div>
      </div>
    </AbsoluteFill>
  );
};
