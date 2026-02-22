import React from "react";
import { theme } from "../theme";
import { fontFamily } from "../load-fonts";

type FooterBarProps = {
  status: string;
  showExport?: boolean;
};

export const FooterBar: React.FC<FooterBarProps> = ({
  status,
  showExport = false,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        borderTop: `1px solid ${theme.border}`,
        fontFamily,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}>
          +
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
          STATUS: {status}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showExport && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: theme.muted,
            }}
          >
            ↑ EXPORT
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            color: theme.muted,
          }}
        >
          twofer v1.0
        </span>
        <span style={{ color: theme.muted, fontSize: 10, opacity: 0.4 }}>
          +
        </span>
      </div>
    </div>
  );
};
