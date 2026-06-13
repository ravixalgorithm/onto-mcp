# Onto MCP in Claude Code

## Config location

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

Claude Code CLI users: the same `mcpServers` block can be added via `claude mcp add` or by editing `~/.claude/settings.json` and nesting under `mcpServers`.

## Config block

Add to the `mcpServers` object (create the key if it doesn't exist):

```json
{
  "mcpServers": {
    "onto": {
      "command": "npx",
      "args": ["-y", "@ontosdk/mcp@latest"],
      "env": {
        "ONTO_API_KEY": "onto_sk_live_your_key_here"
      }
    }
  }
}
```

## Verify

1. Restart Claude Code (fully quit and reopen — `Cmd/Ctrl+Q`, not just close window)
2. Open a new chat
3. Type: `What tools do I have available?`
4. You should see `read_url`, `score_url`, and `read_and_score` in the list

## Try it

> Read https://news.ycombinator.com using Onto and tell me the top three stories.

> Score https://example.com — is it well-structured for AI consumption?

> Read https://stripe.com/pricing using Onto and summarize each plan.

## Where to get an API key

[app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys) — free tier includes 1,000 requests/month, no credit card.
