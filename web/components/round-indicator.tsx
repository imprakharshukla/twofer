interface RoundIndicatorProps {
  current: number;
  max: number;
}

export function RoundIndicator({ current, max }: RoundIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: max }, (_, i) => {
        const round = i + 1;
        const isActive = round === current;
        const isComplete = round < current;

        return (
          <div
            key={round}
            className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${
              isActive
                ? "bg-orange text-background"
                : isComplete
                  ? "bg-secondary text-foreground"
                  : "border border-border text-muted-foreground"
            }`}
          >
            {round}
          </div>
        );
      })}
    </div>
  );
}
