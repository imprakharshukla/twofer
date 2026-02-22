import { z } from "zod";

type Verdict = "approve" | "reject" | "suggest_changes";

/** Normalize common LLM verdict variations to our enum */
function normalizeVerdict(v: unknown): Verdict {
  if (typeof v !== "string") return "suggest_changes";
  const s = v.toLowerCase().trim().replace(/[^a-z_]/g, "");
  if (s.startsWith("approve") || s === "accepted" || s === "agree" || s === "lgtm") return "approve";
  if (s.startsWith("reject") || s === "denied" || s === "disagree") return "reject";
  return "suggest_changes";
}

const VerdictSchema = z
  .unknown()
  .transform(normalizeVerdict);

export const SectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  verdict: VerdictSchema,
  reasoning: z.string().optional().default(""),
});

/** Coerce change_request items to strings — some models return objects */
const ChangeRequestItem = z.unknown().transform((v) => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    // Common patterns: {title, description}, {change, reason}, {request}, etc.
    const obj = v as Record<string, unknown>;
    const parts = [obj.title, obj.description, obj.change, obj.reason, obj.request, obj.content]
      .filter((p) => typeof p === "string" && p.length > 0);
    if (parts.length > 0) return parts.join(": ");
    return JSON.stringify(v);
  }
  return String(v);
});

export const AgentResponseSchema = z.object({
  sections: z.array(SectionSchema).default([]),
  overall_verdict: VerdictSchema,
  change_requests: z.array(ChangeRequestItem).optional().default([]),
  summary: z.string().optional().default(""),
  project_title: z.string().optional().default(""),
});

export type Section = z.infer<typeof SectionSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export function extractJSON(raw: string): string {
  // Try to find JSON inside markdown code fences (any language identifier)
  const fenceMatch = raw.match(/```\w*\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find raw JSON object (greedy — largest match)
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1);
  }

  return raw;
}

/** Try to recover sections from non-standard response shapes */
function normalizeParsed(obj: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(obj.sections) && obj.sections.length > 0) return obj;

  // Some models nest under "specification", "response", "result", "design", etc.
  for (const key of ["specification", "response", "result", "design", "spec", "proposal"]) {
    const nested = obj[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const inner = nested as Record<string, unknown>;
      if (Array.isArray(inner.sections) && inner.sections.length > 0) {
        return { ...obj, ...inner };
      }
    }
  }

  // Some models return sections as a top-level array of objects with title/content
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0 && val[0]?.title && val[0]?.content) {
      return { ...obj, sections: val };
    }
  }

  return obj;
}

export function parseAgentResponse(
  raw: string,
): { success: true; data: AgentResponse } | { success: false; error: string } {
  try {
    const jsonStr = extractJSON(raw);
    const parsed = normalizeParsed(JSON.parse(jsonStr));
    const result = AgentResponseSchema.safeParse(parsed);
    if (result.success) {
      // Reject if sections is empty — model didn't actually produce a spec
      if (result.data.sections.length === 0) {
        return { success: false, error: "No sections found in response" };
      }
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown parse error",
    };
  }
}
