/* The "Onto report" — a single branded summary line appended to the end of
 * every tool response. This is a deliberate growth surface: every agent call
 * leaves Onto's value (reduction, tokens saved, trust score) visible in the
 * host's context, and stamps the brand. Keep it to ONE line, always the same
 * shape so it becomes recognizable.
 *
 * Token estimate uses 4 bytes/token — the same heuristic the dashboard uses
 * for its "tokens saved" stat, so numbers stay consistent across surfaces.
 */

const BYTES_PER_TOKEN = 4;

export interface OntoReportInput {
  /** Raw HTML size in KB (before Onto cleaned it). */
  rawKb?: number;
  /** Clean Markdown size in KB (what the agent actually consumes). */
  cleanKb?: number;
  /** Percentage shrink from raw → clean. */
  reductionPercent?: number;
  /** AIO readability score 0–100, when available. */
  aioScore?: number;
  /** Hallucination-risk band, when available. */
  risk?: 'low' | 'medium' | 'high';
}

/** Estimated input tokens saved by serving Markdown instead of raw HTML. */
export function estimateTokensSaved(rawKb: number, cleanKb: number): number {
  const savedBytes = Math.max(0, (rawKb - cleanKb) * 1024);
  return Math.round(savedBytes / BYTES_PER_TOKEN);
}

/** Compact, human-friendly token count: 1234 → "1.2K", 199000 → "199K". */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/**
 * Build the single-line Onto report. Only the fields that are present get
 * rendered, so the same helper works for read_url (no score) and
 * read_and_score / score_url (with score).
 */
export function ontoReport(input: OntoReportInput): string {
  const parts: string[] = [];

  if (input.rawKb != null && input.cleanKb != null) {
    parts.push(`${input.rawKb}KB → ${input.cleanKb}KB`);
    if (input.reductionPercent != null) parts.push(`${input.reductionPercent}% smaller`);
    parts.push(`~${compact(estimateTokensSaved(input.rawKb, input.cleanKb))} tokens saved`);
  } else if (input.reductionPercent != null) {
    parts.push(`${input.reductionPercent}% smaller`);
  }

  if (input.aioScore != null) {
    parts.push(`AIO ${input.aioScore}/100${input.risk ? ` (${input.risk} risk)` : ''}`);
  }

  return `⚡ Onto · ${parts.join(' · ')} · buildonto.dev`;
}
