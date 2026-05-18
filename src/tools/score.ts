import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import type { ScoreResponse, Recommendation } from '../lib/types.js';

export const scoreUrlInputSchema = z.object({
  url: z.string().url(),
});

export type ScoreUrlInput = z.infer<typeof scoreUrlInputSchema>;

export async function scoreUrl(input: ScoreUrlInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<ScoreResponse>('/v1/score', {
      body: { url: input.url },
    });

    return {
      content: [{ type: 'text' as const, text: formatScoreSummary(result) }],
    };
  } catch (error) {
    return formatToolError(error);
  }
}

export function formatScoreSummary(result: ScoreResponse): string {
  const lines: string[] = [
    `**AIO Score:** ${result.aio_score}/100 (${result.grade})`,
    `**Hallucination risk:** ${result.hallucination_risk}`,
    `**URL:** ${result.url}`,
    '',
  ];

  if (result.benefits.length > 0) {
    lines.push('**What works well:**');
    for (const item of result.benefits) lines.push(`- ${item}`);
    lines.push('');
  }

  if (result.penalties.length > 0) {
    lines.push('**What hurts AI readability:**');
    for (const item of result.penalties) lines.push(`- ${item}`);
    lines.push('');
  }

  const insightEntries = Object.entries(result.insights ?? {});
  if (insightEntries.length > 0) {
    lines.push('**Insights:**');
    for (const [key, value] of insightEntries) {
      lines.push(`- ${key}: ${value ? 'yes' : 'no'}`);
    }
    lines.push('');
  }

  if (result.recommendations.length > 0) {
    lines.push('**Recommendations:**');
    for (const rec of result.recommendations) {
      lines.push(describeRecommendation(rec));
    }
    lines.push('');
  }

  lines.push('**Stats:**');
  lines.push(`- Raw size: ${result.stats.raw_size}`);
  lines.push(`- Efficiency: ${result.stats.efficiency}`);
  lines.push(`- Extraction time: ${result.stats.extraction_time_ms} ms`);

  return lines.join('\n');
}

function describeRecommendation(rec: Recommendation): string {
  if (typeof rec === 'string') return `- ${rec}`;
  if (rec.title) {
    const head = rec.priority ? `**${rec.title}** _(priority: ${rec.priority})_` : `**${rec.title}**`;
    return rec.description ? `- ${head} — ${rec.description}` : `- ${head}`;
  }
  if (rec.description) return `- ${rec.description}`;
  return `- ${JSON.stringify(rec)}`;
}
