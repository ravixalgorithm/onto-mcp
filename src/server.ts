/* Onto MCP Server — exposes the Onto Read API as Model Context Protocol tools.
 *
 * Tools: read_url, score_url, read_and_score.
 * Reads ONTO_API_KEY from env. Defaults base URL to https://api.buildonto.dev.
 *
 * Install in Claude Code:
 *   "mcpServers": {
 *     "onto": {
 *       "command": "npx",
 *       "args": ["-y", "@ontosdk/mcp"],
 *       "env": { "ONTO_API_KEY": "onto_sk_live_..." }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { readUrl, readUrlInputSchema } from './tools/read.js';
import { scoreUrl, scoreUrlInputSchema } from './tools/score.js';
import { readAndScore, readAndScoreInputSchema } from './tools/read-and-score.js';
import { batchRead, batchInputSchema } from './tools/batch.js';
import { mapSite, mapInputSchema } from './tools/map.js';
import { extractData, extractInputSchema } from './tools/extract.js';
import { version } from './lib/version.js';

if (!process.env.ONTO_API_KEY) {
  console.error('[onto-mcp] ONTO_API_KEY environment variable is required.');
  console.error('[onto-mcp] Create a key at https://app.buildonto.dev/read/keys');
  process.exit(1);
}

const server = new Server(
  { name: 'onto', version },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'read_url',
      description:
        'Read any URL and return clean, agent-ready Markdown. Strips HTML noise, preserves semantic content, and returns content optimized for AI consumption. Use this when you need to extract content from a website for an AI agent to process.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to read. Must be a publicly accessible HTTP or HTTPS URL.',
          },
          fresh: {
            type: 'boolean',
            description: 'If true, bypass cache and fetch fresh content. Default false.',
            default: false,
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'score_url',
      description:
        'Get the AIO (AI-readability) score for any URL. Returns a 0-100 score plus a list of penalties, benefits, and recommendations describing why the source is or is not well-suited for AI consumption. Use this to evaluate source quality before relying on it.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to score.',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'read_and_score',
      description:
        'Read any URL and return both clean Markdown AND the AIO accuracy score in one call. The recommended default for most AI workflows — gives both content and quality assessment together, so the AI agent can decide how much to trust the content.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to read and score.',
          },
          fresh: {
            type: 'boolean',
            description: 'If true, bypass cache and fetch fresh content. Default false.',
            default: false,
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'batch',
      description:
        'Process many URLs in ONE call (billed as one request) — so you do not spend a credit per URL. Give either "urls" (an explicit list, up to 50) or "site" (a base URL whose pages are auto-discovered via sitemap). "mode" picks what to do per URL: "read" (Markdown), "read-and-score" (Markdown + AIO trust score, default), or "extract" (JSON-LD + OpenGraph + meta + score). Use this for full-site reads or bulk URL processing.',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit list of URLs to process (up to 50). Use this OR "site".',
          },
          site: {
            type: 'string',
            description: 'Base URL of a site whose pages will be auto-discovered. Use this OR "urls".',
          },
          mode: {
            type: 'string',
            enum: ['read', 'read-and-score', 'extract'],
            description: 'What to do per URL. Default "read-and-score".',
          },
          limit: {
            type: 'number',
            description: 'Site mode only: max pages to discover (default 25, max 50).',
          },
        },
      },
    },
    {
      name: 'map_site',
      description:
        'Discover a site\'s URLs (from sitemap.xml, falling back to on-page links) without reading them. Fast and cheap — use it to plan which pages to read or crawl next.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The site URL to map.',
          },
          limit: {
            type: 'number',
            description: 'Max URLs to return (default 100, max 1000).',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'extract_data',
      description:
        'Extract the structured data a page already declares — JSON-LD (schema.org), OpenGraph cards, and meta tags — plus the AIO trust score. Deterministic, no AI: returns only data present in the page. Use for fast, reliable facts (prices, products, articles) when the site publishes structured data.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to extract structured data from.',
          },
        },
        required: ['url'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_url': {
        const validated = readUrlInputSchema.parse(args ?? {});
        return await readUrl(validated);
      }
      case 'score_url': {
        const validated = scoreUrlInputSchema.parse(args ?? {});
        return await scoreUrl(validated);
      }
      case 'read_and_score': {
        const validated = readAndScoreInputSchema.parse(args ?? {});
        return await readAndScore(validated);
      }
      case 'batch': {
        const validated = batchInputSchema.parse(args ?? {});
        return await batchRead(validated);
      }
      case 'map_site': {
        const validated = mapInputSchema.parse(args ?? {});
        return await mapSite(validated);
      }
      case 'extract_data': {
        const validated = extractInputSchema.parse(args ?? {});
        return await extractData(validated);
      }
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text' as const, text: `Tool '${name}' failed: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr (not stdout) — stdout is reserved for MCP protocol frames
  console.error(`[onto-mcp] v${version} listening on stdio`);
}

main().catch((err) => {
  console.error('[onto-mcp] fatal:', err);
  process.exit(1);
});
