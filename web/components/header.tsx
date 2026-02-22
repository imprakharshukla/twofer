import { GridMark } from "./grid-marks";

interface HeaderProps {
  round: number;
  maxRounds: number;
  status: string;
}

export function Header({ round, maxRounds, status }: HeaderProps) {
  const statusLabel = status.toUpperCase();
  const roundStr = String(round).padStart(2, "0");
  const maxStr = String(maxRounds).padStart(2, "0");

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GridMark />
          <h1 className="text-lg font-black tracking-tight text-primary">
            TWOFER
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1">
            <span className="swiss-label mr-2">ROUND</span>
            <span className="text-3xl font-black tracking-tighter text-orange">
              {roundStr}
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              /{maxStr}
            </span>
          </div>

          <div className="highlight-bar">{statusLabel}</div>

          <GridMark />
        </div>
      </div>
    </header>
  );
}
