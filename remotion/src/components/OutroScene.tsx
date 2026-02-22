import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ◆ diamond callback
  const diamondOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diamondScale = interpolate(frame, [0, 18], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [14, 34], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Stats line
  const statsOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // TWOFER logo + underline
  const logoOpacity = interpolate(frame, [44, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underlineWidth = interpolate(frame, [52, 68], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Final fade to black
  const fadeOut = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        opacity: fadeOut,
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

      {/* Center stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Diamond */}
        <div
          style={{
            opacity: diamondOpacity,
            transform: `scale(${diamondScale})`,
            fontSize: 32,
            color: theme.orange,
            fontFamily: "monospace",
          }}
        >
          ◆
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontSize: 24,
            fontWeight: 700,
            color: theme.white,
            letterSpacing: "-0.01em",
          }}
        >
          Multi-agent debate. Battle-tested specs.
        </div>

        {/* Stats */}
        <div
          style={{
            opacity: statsOpacity,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.muted,
          }}
        >
          2 agents · 2 rounds · 10 sections · Full consensus
        </div>

        {/* Logo + underline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            opacity: logoOpacity,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: theme.white,
            }}
          >
            TWOFER
          </span>
          <div
            style={{
              width: underlineWidth,
              height: 2,
              backgroundColor: theme.orange,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
