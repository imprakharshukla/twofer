import { Check } from "@phosphor-icons/react";
import { DisputedIcon } from "./ascii-animations";
import { SectionDivider } from "./grid-marks";

interface ConsensusSection {
  title: string;
  agreed: boolean;
  agentContents: Record<string, string>;
  finalContent: string;
}

interface ConsensusViewProps {
  sections: ConsensusSection[];
}

export function ConsensusView({ sections }: ConsensusViewProps) {
  if (sections.length === 0) return null;

  const agreed = sections.filter((s) => s.agreed);
  const disputed = sections.filter((s) => !s.agreed);

  return (
    <div>
      <SectionDivider label="CONSENSUS" className="mb-4" />

      <div className="grid grid-cols-2 gap-4 px-2">
        {/* Agreed */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="swiss-label text-agreed">
              AGREED ({agreed.length})
            </span>
          </div>
          <div className="space-y-2">
            {agreed.map((section) => (
              <div
                key={section.title}
                className="flex items-start gap-2 text-sm"
              >
                <Check
                  size={14}
                  weight="bold"
                  className="mt-0.5 shrink-0 text-agreed"
                />
                <span className="font-medium text-foreground">
                  {section.title}
                </span>
              </div>
            ))}
            {agreed.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No sections agreed yet
              </span>
            )}
          </div>
        </div>

        {/* Disputed */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="swiss-label text-disputed">
              DISPUTED ({disputed.length})
            </span>
          </div>
          <div className="space-y-2">
            {disputed.map((section) => (
              <div
                key={section.title}
                className="flex items-start gap-2 text-sm"
              >
                <div className="mt-0.5 shrink-0">
                  <DisputedIcon />
                </div>
                <span className="font-medium text-foreground">
                  {section.title}
                </span>
              </div>
            ))}
            {disputed.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No disputed sections
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
