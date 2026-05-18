import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import type { ReadAndScoreResponse } from '../lib/types.js';

export const readAndScoreInputSchema = z.object({
  url: z.string().url(),
  fresh: z.boolean().optional().default(false),
});

export type ReadAndScoreInput = z.infer<typeof readAndScoreInputSchema>;

export async function readAndScore(input: ReadAndScoreInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<ReadAndScoreResponse>('/v1/read-and-score', {
      body: { url: input.url, fresh: input.fresh },
    });

    const trustHint = trustLine(result.aio_score, result.hallucination_risk);
    const summaryLines = [
      `**Source quality assessment (from Onto):**`,
      `- AIO Score: ${result.aio_score}/100 (${result.grade})`,
      `- Hallucination risk: ${result.hallucination_risk}`,
      `- Reduction: ${result.stats.reduction_percent}% (${result.stats.raw_html_size_kb} KB → ${result.stats.markdown_size_kb} KB)`,
      `- Cache: ${result.cache.hit ? 'HIT' : 'MISS'}`,
      '',
      trustHint,
    ];

    return {
      content: [
        { type: 'text' as const, text: result.markdown },
        { type: 'text' as const, text: `\n\n---\n\n${summaryLines.join('\n')}` },
      ],
    };
  } catch (error) {
    return formatToolError(error);
  }
}

function trustLine(score: number, risk: 'low' | 'medium' | 'high'): string {
  if (risk === 'high' || score < 40) {
    return 'Trust signal: low — this source is poorly structured for AI consumption. Verify any facts before relying on them.';
  }
  if (risk === 'medium' || score < 70) {
    return 'Trust signal: medium — source is partially AI-readable. Cross-check critical claims.';
  }
  return 'Trust signal: high — source is well-structured for AI consumption.';
}
