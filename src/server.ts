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
