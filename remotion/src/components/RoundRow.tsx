import React from "react";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

type RoundRowProps = {
  current: number;
  max: number;
};

export const RoundRow: React.FC<RoundRowProps> = ({ current, max }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        fontFamily,
      }}
    >
      {/* Round boxes */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Array.from({ length: max }, (_, i) => {
          const round = i + 1;
          const isActive = round === current;
          const isComplete = round < current;

          return (
            <div
              key={round}
              style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: isActive
                  ? theme.orange
                  : isComplete
                    ? theme.secondary
                    : "transparent",
                color: isActive
                  ? theme.bg
                  : isComplete
                    ? theme.fg
                    : theme.muted,
                border: !isActive && !isComplete
                  ? `1px solid ${theme.border}`
                  : "none",
              }}
            >
              {round}
            </div>
          );
        })}
      </div>

      {/* Connected indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: theme.agreed, fontSize: 12 }}>⚡</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.muted,
          }}
        >
          CONNECTED
        </span>
      </div>
    </div>
  );
};
