# Onto MCP in Cursor

## Config location

Cursor → Settings → Features → **Model Context Protocol** → "Add server"

Or edit the config file directly:

| OS | Path |
|---|---|
| macOS | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%\.cursor\mcp.json` |
| Linux | `~/.cursor/mcp.json` |

## Config block

```json
{
  "mcpServers": {
    "onto": {
      "command": "npx",
      "args": ["-y", "@ontosdk/mcp"],
      "env": {
        "ONTO_API_KEY": "onto_sk_live_your_key_here"
      }
    }
  }
}
```

## Verify

1. Restart Cursor
2. Open the Composer or Chat
3. Ask: "What MCP tools are available?"
4. `read_url`, `score_url`, `read_and_score` should be listed

## Try it

> Use Onto to read https://docs.cursor.com and summarize the @-symbol reference.

## API key

Get one at [app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys).
