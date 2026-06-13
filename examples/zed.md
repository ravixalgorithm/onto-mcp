# Onto MCP in Zed

## Config location

Zed → Settings → Open `settings.json`

Or directly:

| OS | Path |
|---|---|
| macOS | `~/.config/zed/settings.json` |
| Linux | `~/.config/zed/settings.json` |
| Windows | `%APPDATA%\Zed\settings.json` |

## Config block

Add (or merge with) the `context_servers` key:

```json
{
  "context_servers": {
    "onto": {
      "command": {
        "path": "npx",
        "args": ["-y", "@ontosdk/mcp@latest"],
        "env": {
          "ONTO_API_KEY": "onto_sk_live_your_key_here"
        }
      }
    }
  }
}
```

## Verify

Restart Zed. Open Assistant and check the context server status indicator — "onto" should appear as connected.

## API key

Get one at [app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys).
