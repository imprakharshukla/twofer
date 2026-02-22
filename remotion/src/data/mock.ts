export const topic = "Design a URL shortener API";

export const agents = {
  a: { name: "CLAUDE-A", dotColor: "#ff6b2b" },
  b: { name: "CLAUDE-B", dotColor: "#d9d9d9" },
} as const;

export const sections = [
  "Architecture",
  "Data Model",
  "API Design",
  "Authentication",
  "Core Shortener Service",
  "Frontend",
  "State Management",
  "Deployment",
  "Security",
  "Testing",
] as const;

export const round1Summary = {
  a: "A production-ready URL shortener REST API built with Node.js 20, TypeScript 5, Fastify 4, PostgreSQL 15, and Redis 7. The system provides URL creation with optional custom codes and expiry, redirect resolution with Redis caching and dynamic TTL, click analytics with privacy-preserving IP hashing, and API key authentication with Redis-cached validation.",
  b: "A production-ready URL shortener REST API built with Hono on Bun, PostgreSQL for persistent storage, and Redis for sub-millisecond redirect caching and rate limiting. The service exposes four core endpoints, uses SHA-256-hashed API keys for optional authentication, enforces sliding-window rate limits per tier, buffers click counts in Redis to avoid hot-row DB contention.",
};

export const round2Summary = {
  a: "Claude-B's proposal is solid and well-structured. The Hono + Bun + PostgreSQL + Redis stack is a reasonable and performant choice. All core sections are approved with three targeted change requests: replacing the O(N) Redis KEYS scan in the click flush job with a dirty-set index pattern, and noting the option to preserve per-click analytics granularity alongside the in-row click_count counter.",
  b: "Claude-A's specification is comprehensive and well-reasoned. Both proposals converge on the same core architecture (PostgreSQL + Redis, API key auth, nanoid codes, Redis-cached redirects, fire-and-forget analytics). Claude-A improves on my proposal in three meaningful ways: a dedicated clicks table enabling rich analytics aggregations, DNS-based SSRF protection that handles CNAME chains, and Zod-validated config at startup.",
};

// Round 1: all approve, 1 disputed (Core Shortener Service has different content)
export const round1Consensus = {
  agreed: [
    "Architecture",
    "Data Model",
    "API Design",
    "Authentication",
    "Frontend",
    "State Management",
    "Deployment",
    "Security",
    "Testing",
  ],
  disputed: ["Core Shortener Service"],
};

// Round 2: all agreed, 0 disputed (converged)
export const round2Consensus = {
  agreed: [
    "Architecture",
    "Data Model",
    "API Design",
    "Authentication",
    "Core Shortener Service",
    "Frontend",
    "State Management",
    "Deployment",
    "Security",
    "Testing",
  ],
  disputed: [] as string[],
};
