import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callOntoApi } from '../lib/api-client.js';
import { formatToolError } from '../lib/errors.js';
import type { MapResponse } from '../lib/types.js';

export const mapInputSchema = z.object({
  url: z.string().url(),
  limit: z.number().int().min(1).max(1000).optional(),
});

export type MapInput = z.infer<typeof mapInputSchema>;

export async function mapSite(input: MapInput): Promise<CallToolResult> {
  try {
    const result = await callOntoApi<MapResponse>('/v1/map', {
      body: { url: input.url, limit: input.limit },
    });

    const lines: string[] = [
      `# Sitemap for ${result.url}`,
      `Discovered ${result.count} URL(s) via ${result.source}.`,
      '',
      ...result.urls.map((u) => `- ${u}`),
      '',
      `⚡ Onto · ${result.count} URLs mapped (${result.source}) · buildonto.dev`,
    ];

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  } catch (error) {
    return formatToolError(error);
  }
}
