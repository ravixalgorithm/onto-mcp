import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import { ontoReport } from '../lib/report.js';
import type { ExtractResponse } from '../lib/types.js';

export const extractInputSchema = z.object({
  url: z.string().url(),
  fresh: z.boolean().optional().default(false),
});

export type ExtractInput = z.infer<typeof extractInputSchema>;

export async function extractData(input: ExtractInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<ExtractResponse>('/v1/extract', {
      body: { url: input.url, fresh: input.fresh },
    });

    const og = Object.entries(result.structured.openGraph);
    const meta = Object.entries(result.structured.meta);

    const lines: string[] = [
      `# Structured data for ${result.url}`,
      result.title ? `Title: ${result.title}` : '',
      `Found ${result.counts.json_ld} JSON-LD object(s), ${result.counts.open_graph} OpenGraph tag(s), ${result.counts.meta} meta tag(s).`,
      '',
      '## JSON-LD',
      result.structured.jsonLd.length > 0
        ? '```json\n' + JSON.stringify(result.structured.jsonLd, null, 2) + '\n```'
        : '(none declared)',
      '',
      '## OpenGraph',
      og.length > 0 ? og.map(([k, v]) => `- ${k}: ${v}`).join('\n') : '(none)',
      '',
      '## Meta',
      meta.length > 0 ? meta.map(([k, v]) => `- ${k}: ${v}`).join('\n') : '(none)',
      '',
      ontoReport({ aioScore: result.aio_score, risk: result.hallucination_risk }),
    ].filter((line) => line !== '');

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  } catch (error) {
    return formatToolError(error);
  }
}
