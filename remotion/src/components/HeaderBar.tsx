import React from "react";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

type HeaderBarProps = {
  round: number;
  maxRounds: number;
  status: "CONNECTING" | "DEBATING" | "COMPLETE";
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  round,
  maxRounds,
  status,
}) => {
  const roundStr = String(round).padStart(2, "0");
  const maxStr = String(maxRounds).padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: `1px solid ${theme.border}`,
        fontFamily,
      }}
    >
      {/* Left: logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}
        >
          +
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "0.02em",
            color: theme.white,
          }}
        >
          TWOFER
        </span>
      </div>

      {/* Right: round counter + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Round label */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.muted,
          }}
        >
          ROUND
        </span>

        {/* Big round number */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: theme.orange,
              lineHeight: 1,
            }}
          >
            {roundStr}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: theme.muted,
            }}
          >
            /{maxStr}
          </span>
        </div>

        {/* Status badge */}
        <div
          style={{
            backgroundColor: theme.orange,
            color: theme.bg,
            padding: "4px 12px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {status}
        </div>

        <span
          style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}
        >
          +
        </span>
      </div>
    </div>
  );
};
