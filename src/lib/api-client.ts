/* Thin HTTP wrapper around the Onto Read API. Reads ONTO_API_KEY at call time
 * (not module-load) so server.ts can fail with a clean error message first. */

import { version as PACKAGE_VERSION } from './version.js';
import type { ApiErrorBody } from './types.js';

const DEFAULT_BASE = 'https://api.buildonto.dev';
const REQUEST_TIMEOUT_MS = 15_000;

export class OntoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'OntoApiError';
  }
}

interface CallOptions {
  body: unknown;
  signal?: AbortSignal;
}

export async function callOntoApi<T>(endpoint: string, options: CallOptions): Promise<T> {
  const apiKey = process.env.ONTO_API_KEY;
  if (!apiKey) {
    throw new OntoApiError(
      'ONTO_API_KEY environment variable is not set. Get a key at https://app.buildonto.dev/read/keys',
      0,
      'NO_API_KEY',
    );
  }

  const base = process.env.ONTO_API_BASE ?? DEFAULT_BASE;
  const url = `${base}${endpoint}`;

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `@ontosdk/mcp/${PACKAGE_VERSION}`,
      },
      body: JSON.stringify(options.body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new OntoApiError(
        `Onto API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The target site may be slow or unreachable.`,
        0,
        'TIMEOUT',
      );
    }
    throw new OntoApiError(
      `Failed to reach Onto API at ${base}: ${(err as Error).message}`,
      0,
      'NETWORK_ERROR',
    );
  }

  const rawBody = await response.text();

  if (!response.ok) {
    let parsed: Partial<ApiErrorBody> = {};
    try {
      parsed = JSON.parse(rawBody) as Partial<ApiErrorBody>;
    } catch {
      // Body wasn't JSON; fall through with status-code-only error
    }

    const message = humanizeError(response.status, parsed);
    throw new OntoApiError(message, response.status, parsed.error);
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (err) {
    throw new OntoApiError(
      `Onto API returned invalid JSON: ${(err as Error).message}`,
      response.status,
      'INVALID_RESPONSE',
    );
  }
}

function humanizeError(status: number, body: Partial<ApiErrorBody>): string {
  if (status === 401) {
    return 'Invalid Onto API key. Verify your key at https://app.buildonto.dev/read/keys';
  }
  if (status === 402) {
    return (
      body.message ??
      'Monthly plan quota exceeded and credit balance is empty. Top up credits at https://app.buildonto.dev/read/billing'
    );
  }
  if (status === 403) {
    if (body.error === 'ROBOTS_BLOCKED') {
      return body.message ?? 'The target site blocks AI crawlers via robots.txt.';
    }
    return body.message ?? 'Forbidden.';
  }
  if (status === 429) {
    return (
      body.message ??
      'Onto API rate limit exceeded. Upgrade your tier at https://app.buildonto.dev/read/billing or wait for the monthly reset.'
    );
  }
  if (status >= 500) {
    return body.message ?? `Onto API server error (${status}). Try again in a moment.`;
  }
  return body.message ?? `Onto API returned ${status}.`;
}
