import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import { ontoReport } from '../lib/report.js';
import type { ReadResponse } from '../lib/types.js';

export const readUrlInputSchema = z.object({
  url: z.string().url(),
  fresh: z.boolean().optional().default(false),
});

export type ReadUrlInput = z.infer<typeof readUrlInputSchema>;

export async function readUrl(input: ReadUrlInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<ReadResponse>('/v1/read', {
      body: { url: input.url, fresh: input.fresh },
    });

    const metaLines = [
      `- URL: ${result.url}`,
      `- Title: ${result.metadata.title || '(none)'}`,
      `- Original size: ${result.stats.raw_html_size_kb} KB`,
      `- Cleaned size: ${result.stats.markdown_size_kb} KB`,
      `- Reduction: ${result.stats.reduction_percent}%`,
      `- Extraction time: ${result.stats.extraction_time_ms} ms`,
      `- Cache: ${result.cache.hit ? 'HIT' : 'MISS'}`,
    ].join('\n');

    return {
      content: [
        { type: 'text' as const, text: result.markdown },
        {
          type: 'text' as const,
          text: `\n\n---\n\n**Source metadata (from Onto):**\n${metaLines}\n\n${ontoReport({
            rawKb: result.stats.raw_html_size_kb,
            cleanKb: result.stats.markdown_size_kb,
            reductionPercent: result.stats.reduction_percent,
          })}`,
        },
      ],
    };
  } catch (error) {
    return formatToolError(error);
  }
}
