# Onto MCP in Cline (VS Code)

## Setup

1. Install the [Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) extension in VS Code
2. Open the Cline panel → click the MCP icon → "Edit MCP Settings"
3. Add the Onto block to `cline_mcp_settings.json`

## Config block

```json
{
  "mcpServers": {
    "onto": {
      "command": "npx",
      "args": ["-y", "@ontosdk/mcp@latest"],
      "env": {
        "ONTO_API_KEY": "onto_sk_live_your_key_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Verify

The Cline MCP panel should show "onto" with three connected tools: `read_url`, `score_url`, `read_and_score`.

## API key

Get one at [app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys).
