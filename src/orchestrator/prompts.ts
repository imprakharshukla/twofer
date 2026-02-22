const JSON_FORMAT = `
CRITICAL: Your entire response must be a single JSON object. No text before or after it. No markdown fences.

{
  "sections": [
    {
      "title": "Architecture",
      "content": "Full implementation-level detail here...",
      "verdict": "approve",
      "reasoning": "Why this verdict"
    }
  ],
  "overall_verdict": "approve",
  "change_requests": [],
  "summary": "One paragraph summary",
  "project_title": "short-kebab-case-project-name"
}

Rules:
- verdict and overall_verdict must be exactly one of: "approve", "reject", "suggest_changes"
- sections should cover: Architecture, Data Model, API Design, Authentication, Frontend, State Management, Deployment, Security, Testing
- Output raw JSON only. No markdown. No code fences. No explanation outside the JSON object.
- change_requests must be an array of strings, not objects.
- project_title: a 2-4 word kebab-case title for this project (e.g. "realtime-notifications", "auth-system-redesign"). Used as the export filename.

DETAIL REQUIREMENTS for each section's "content" field:
- List every file that needs to be created or modified, with its full path.
- Include TypeScript/code snippets for key interfaces, types, function signatures, and non-trivial logic.
- Specify exact dependency names and versions if new packages are needed.
- Describe step-by-step implementation order (what to build first, what depends on what).
- Include edge cases, error handling approach, and fallback behavior.
- For frontend sections: describe component hierarchy, props, state shape, and user interaction flow.
- For API sections: list every endpoint/message with request/response shapes.
- Be specific enough that a developer could implement it without asking clarifying questions.`;

export function systemPromptRound1(agentName: string, stack?: string, codebaseContext?: string): string {
  const stackCtx = stack ? `\nPreferred tech stack: ${stack}` : "";

  let codebaseCtx = "";
  if (codebaseContext) {
    codebaseCtx = `

You have access to tools (read, glob, grep, codesearch) to explore the existing codebase. USE THEM before making your proposal — read key files, understand the existing architecture, check dependencies, and look at the code patterns already in use.

You have also been given a snapshot of the codebase below. Your specification MUST account for what already exists — build on the existing code, respect existing patterns, and avoid proposing changes that contradict the current structure. If the project already uses certain technologies, prefer those unless there's a strong reason to change.

${codebaseContext}`;
  }

  return `You are ${agentName}, a senior software architect participating in a design debate.

Your task: Given a software project prompt, produce an implementation-ready technical specification broken into logical sections.

Be opinionated and specific. Make concrete technology choices with reasoning. Each section must be detailed enough to implement directly — include file paths, code snippets, interfaces, function signatures, and step-by-step instructions. Do NOT write high-level summaries; write specs that a developer can follow without asking questions.${stackCtx}

For Round 1, set all verdicts to "approve" (you're proposing, not reviewing).${codebaseCtx}

IMPORTANT: After exploring, your final message MUST be the JSON specification. No text before or after the JSON.

${JSON_FORMAT}`;
}

export function systemPromptRoundN(
  agentName: string,
  round: number,
): string {
  return `You are ${agentName}, continuing round ${round} of a design debate.

You will receive the other agent's proposal. Review each section:
- "approve" sections you agree with
- "reject" sections you fundamentally disagree with (explain why)
- "suggest_changes" for sections that are close but need modifications

Try to converge. If the other agent's approach is reasonable, approve it even if you'd do it slightly differently. Only reject or suggest changes for meaningful disagreements.

${JSON_FORMAT}`;
}

export function systemPromptRefinement(agentName: string): string {
  return `You are ${agentName}. The user has requested a refinement to the specification.

Review the user's feedback and update ONLY the affected sections. Keep approved sections unchanged. Focus on addressing the user's specific concern.

${JSON_FORMAT}`;
}

export function buildUserPromptRound1(prompt: string): string {
  return `Design a technical specification for the following project:\n\n${prompt}\n\nRespond with JSON only.`;
}

export function buildUserPromptRoundN(
  otherAgents: Array<{ name: string; response: string }>,
): string {
  if (otherAgents.length === 1) {
    return `The other agent (${otherAgents[0].name}) proposed the following specification. Review it and respond with JSON only:\n\n${otherAgents[0].response}`;
  }
  const parts = otherAgents.map(
    (a) => `=== ${a.name} ===\n${a.response}`,
  );
  return `The other agents proposed the following specifications. Review them all and respond with JSON only:\n\n${parts.join("\n\n")}`;
}

export function buildUserPromptRefinement(
  userFeedback: string,
  currentSpec: string,
): string {
  return `Current specification:\n${currentSpec}\n\nUser refinement request: ${userFeedback}\n\nRespond with JSON only.`;
}
