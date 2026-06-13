# Onto MCP Server

The official Onto Model Context Protocol server. Add clean web content reading and AI-readability scoring to Claude Code, Cursor, Cline, Zed, or any MCP-compatible AI client.

## What this does

Onto's MCP server exposes these tools to any AI agent:

- **`read_url`** — Read any URL and get back clean, agent-ready Markdown (typically 10× smaller than raw HTML)
- **`score_url`** — Get the AIO (AI-readability) score for any URL with a breakdown of what helps and what hurts AI consumption
- **`read_and_score`** — Both at once: clean content plus quality assessment so the agent knows how much to trust the source
- **`batch`** — Read, score, or extract many URLs (an explicit list or a whole site) in one call
- **`map_site`** — Discover a site's URLs via its sitemap, without reading them
- **`extract_data`** — Return the structured data a page already declares (JSON-LD, OpenGraph, meta)

Every tool response ends with a one-line **⚡ Onto report** — reduction, tokens saved, and AIO score — so the value is visible on every call.

This is the official MCP wrapper for the [Onto Read API](https://api.buildonto.dev). It's a thin, deterministic layer: Onto cleans and scores with a rule-based engine (no LLM in the loop), so your agent's own model never has to parse raw HTML.

## Why use this?

When AI agents read websites today, they parse hundreds of KB of React noise to find a few KB of actual content. This burns tokens and causes hallucinations.

Onto strips the noise server-side, returns the agent-ready format, and reports a confidence score for the source. One tool call, one accurate answer.

## Quick start

### 1. Get an Onto API key

Sign up at [app.buildonto.dev](https://app.buildonto.dev) and create an API key at **Read → Keys**.

Free tier: 1,000 requests / month. No credit card.

### 2. Install in Claude Code

Add to your Claude Code MCP config:

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

Restart Claude Code. The Onto tools (`read_url`, `score_url`, `read_and_score`, `batch`, `map_site`, `extract_data`) will appear in the available tools list.

### 3. Install in Cursor

Add to Cursor's MCP configuration (Settings → Features → MCP):

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

See [`examples/`](./examples/) for Cline, Zed, and Continue configs.

### 4. Use it

In Claude Code or Cursor, try:

> Read https://stripe.com/pricing using Onto and summarize the pricing tiers.

The agent calls `read_url`, gets clean Markdown, and returns an accurate summary without parsing hundreds of KB of layout HTML.

## Tools

### `read_url`

Returns clean Markdown for a URL with metadata about the extraction (sizes, reduction %, cache state).

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Publicly accessible HTTP(S) URL |
| `fresh` | boolean | no | If true, bypass cache (default: false) |

### `score_url`

Returns the AIO (AI-readability) score for a URL — 0-100 with a letter grade, hallucination risk, and a structured list of penalties / benefits / recommendations.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | URL to score |

### `read_and_score`

Returns clean Markdown plus the AIO score in one call. Recommended default for agentic workflows.

**Input:** same as `read_url`.

### `batch`

Process many URLs in **one call** — billed as a single request, so you don't spend a credit per URL. Give an explicit list or a base URL whose pages are auto-discovered.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | string[] | one of | Explicit list of URLs (max 50). Use this **or** `site`. |
| `site` | string | one of | Base URL whose pages are auto-discovered via sitemap. Use this **or** `urls`. |
| `mode` | `"read"` \| `"read-and-score"` \| `"extract"` | no | What to do per URL (default `"read-and-score"`) |
| `limit` | number | no | Site mode only: max pages to discover (default 25, max 50) |

### `map_site`

Discover a site's URLs (sitemap → on-page links) without reading them. Cheap — use it to plan which pages to read or batch next.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Base URL of the site to map |
| `limit` | number | no | Max URLs to return (default 100, max 1000) |

### `extract_data`

Return the structured data a page already declares — JSON-LD, OpenGraph, and meta tags — plus the AIO score. Deterministic; no fields are inferred by a model.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | URL to extract structured data from |

## Pricing

| Tier | Monthly requests | Price |
|---|---|---|
| Free | 1,000 | $0 |
| Starter | 10,000 | $9 |
| Growth | 100,000 | $49 |
| Scale | 500,000 | $250 |
| Enterprise | Custom | Contact sales |

Manage your subscription at [app.buildonto.dev/read/billing](https://app.buildonto.dev/read/billing). Credit packs ($5–$200) are available for overflow once you're on a paid tier.

## Configuration

Environment variables:

- `ONTO_API_KEY` (required) — Your Onto API key from [app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys)
- `ONTO_API_BASE` (optional) — Override the API base URL (default: `https://api.buildonto.dev`)

## Troubleshooting

### "Invalid Onto API key"

Verify your key at [app.buildonto.dev/read/keys](https://app.buildonto.dev/read/keys). If you recently rotated keys, your MCP config may have a stale value.

### "Monthly quota exceeded"

You've used your monthly allotment. Upgrade at [app.buildonto.dev/read/billing](https://app.buildonto.dev/read/billing) or wait for the monthly reset. Paid tiers can also top up with credit packs.

### Tool doesn't appear in Claude Code / Cursor

1. Verify the config file is valid JSON
2. Restart the MCP host (Claude Code, Cursor, etc.)
3. Check the host's MCP logs for connection errors
4. Make sure `npx` is on your PATH

### "Request timed out"

The target site may be slow or unreachable. Onto's request timeout is 15 seconds. Retry, or try a different URL.

## Links

- Onto homepage: [buildonto.dev](https://buildonto.dev)
- API documentation: [docs.buildonto.dev](https://docs.buildonto.dev)
- Dashboard: [app.buildonto.dev](https://app.buildonto.dev)
- GitHub issues: [github.com/ravixalgorithm/onto-mcp/issues](https://github.com/ravixalgorithm/onto-mcp/issues)
- Contact: [founder@buildonto.dev](mailto:founder@buildonto.dev)

## About Onto

Onto is the compatibility layer for the agent web. Three products on one engine:

- **Read** (this MCP server + API) — AI developers read any URL cleanly
- **Serve** ([Next.js SDK](https://www.npmjs.com/package/@ontosdk/next)) — Site owners serve clean Markdown to AI crawlers
- **Act** (coming Q3 2026) — Agents act on websites through semantic intent

Built for AI agents reading the web. Built so they read it correctly.

## License

MIT
