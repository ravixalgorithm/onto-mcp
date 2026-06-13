import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import type { BatchResponse, BatchResult } from '../lib/types.js';

export const batchInputSchema = z
  .object({
    urls: z.array(z.string().url()).min(1).max(50).optional(),
    site: z.string().url().optional(),
    mode: z.enum(['read', 'read-and-score', 'extract']).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .refine((v) => (v.urls && v.urls.length > 0) || v.site, {
    message: 'Provide either "urls" (array) or "site" (string).',
  });

export type BatchInput = z.infer<typeof batchInputSchema>;

function renderResult(r: BatchResult): string {
  if (!r.ok) {
    return `### ${r.url}\n_skipped — ${r.error?.code}: ${r.error?.message}_`;
  }
  const head = [`### ${r.title || r.url}`, r.url];
  if (r.aio_score != null) {
    head.push(`AIO ${r.aio_score}/100 (${r.grade}, ${r.hallucination_risk} risk)`);
  }
  if (r.reduction_percent != null) head.push(`${r.reduction_percent}% smaller`);
  const lines = [head.join(' · ')];

  if (r.structured) {
    lines.push('', `JSON-LD: ${r.counts?.json_ld ?? 0} · OG: ${r.counts?.open_graph ?? 0} · meta: ${r.counts?.meta ?? 0}`);
    if (r.structured.jsonLd.length > 0) {
      lines.push('```json', JSON.stringify(r.structured.jsonLd, null, 2), '```');
    }
  } else if (r.markdown) {
    lines.push('', r.markdown);
  }
  return lines.join('\n');
}

export async function batchRead(input: BatchInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<BatchResponse>('/v1/batch', {
      body: { urls: input.urls, site: input.site, mode: input.mode, limit: input.limit },
    });

    const header =
      result.source === 'site'
        ? `# Batch ${result.mode} — site discovery`
        : `# Batch ${result.mode} — ${result.requested} URL(s)`;

    const lines = [
      header,
      `${result.succeeded}/${result.requested} succeeded.`,
      '',
      ...result.results.map(renderResult).flatMap((block) => [block, '']),
      `⚡ Onto · ${result.succeeded}/${result.requested} URLs in one call · buildonto.dev`,
    ];

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  } catch (error) {
    return formatToolError(error);
  }
}
