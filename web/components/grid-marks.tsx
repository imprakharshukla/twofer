export function GridMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid-mark select-none ${className}`} aria-hidden="true">
      +
    </span>
  );
}

export function CornerMarks({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <GridMark className="absolute -top-1 -left-1" />
      <GridMark className="absolute -top-1 -right-1" />
      <GridMark className="absolute -bottom-1 -left-1" />
      <GridMark className="absolute -bottom-1 -right-1" />
      {children}
    </div>
  );
}

export function SectionDivider({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <GridMark />
      <div className="h-px flex-1 bg-border" />
      {label && <span className="swiss-label">{label}</span>}
      <div className="h-px flex-1 bg-border" />
      <GridMark />
    </div>
  );
}
