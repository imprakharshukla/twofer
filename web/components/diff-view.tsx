interface DiffViewProps {
  title: string;
  agentContents: Record<string, string>;
}

export function DiffView({ title, agentContents }: DiffViewProps) {
  const agents = Object.entries(agentContents);
  const gridCols =
    agents.length <= 2
      ? "grid-cols-2"
      : agents.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className="border border-border">
      <div className="border-b border-border px-4 py-2">
        <span className="text-sm font-bold text-primary">{title}</span>
      </div>
      <div className={`grid ${gridCols} divide-x divide-border`}>
        {agents.map(([name, content]) => (
          <div key={name} className="p-4">
            <span className="swiss-label text-muted-foreground mb-2 block">
              {name.toUpperCase()}
            </span>
            <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">
              {content || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
