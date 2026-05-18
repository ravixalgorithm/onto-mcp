/* Format errors as MCP tool responses. We don't throw McpError for
 * tool-call failures — the AI host shows tool errors to the user as
 * unhelpful internal-error messages. Returning isError: true with a
 * text body lets the model see what went wrong and recover. */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OntoApiError } from './api-client.js';

export function formatToolError(error: unknown): CallToolResult {
  if (error instanceof OntoApiError) {
    return {
      content: [{ type: 'text', text: error.message }],
      isError: true,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: `Onto MCP error: ${message}\n\nTroubleshooting:\n- Verify ONTO_API_KEY is set and valid (https://app.buildonto.dev/read/keys)\n- Check the target URL is publicly accessible\n- Check your monthly quota at https://app.buildonto.dev/read/usage`,
      },
    ],
    isError: true,
  };
}
