/* Update awareness for the Onto MCP server.
 *
 * An MCP server is a child process the host (Claude Code, Cursor, …) spawns and
 * owns — it can't replace its own running code, and it shouldn't silently
 * npm-install new versions behind the user's back. What it CAN do, and what this
 * module does, is make updates impossible to miss:
 *
 *   1. detectUpgrade()    — on boot, compare the running version to the last one
 *                           we recorded on disk. If it grew, queue a one-time
 *                           "what's new" note for the first tool response.
 *   2. startUpdateCheck() — fire one lightweight, non-blocking GET to the npm
 *                           registry for the latest published version. If we're
 *                           behind, expose a compact "restart to update" nudge
 *                           that gets stamped onto the Onto report line.
 *
 * Both fail silent (offline, timeout, unwritable home dir) and both can be
 * disabled with ONTO_NO_UPDATE_CHECK=1. No telemetry is sent — the registry GET
 * only reads public package metadata. */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { version as currentVersion } from './version.js';
import { formatWhatsNew } from './changelog.js';

const PKG = '@ontosdk/mcp';
const STATE_DIR = path.join(os.homedir(), '.onto-mcp');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const CHECK_TIMEOUT_MS = 1500;

let latestVersion: string | null = null; // set only when the registry has a newer one
let pendingWhatsNew: string | null = null; // queued by detectUpgrade, drained once
let whatsNewConsumed = false;

/** Numeric major.minor.patch compare. Ignores any prerelease/build suffix.
 *  Returns >0 if a is newer than b, <0 if older, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v.split('-')[0].split('.').map((x) => parseInt(x, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function readState(): { lastVersion?: string } {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as { lastVersion?: string };
  } catch {
    return {};
  }
}

function writeState(lastVersion: string): void {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify({ lastVersion }));
  } catch {
    /* unwritable home dir (sandbox/CI) — non-fatal */
  }
}

/** Compare running version to the last one we saw; queue "what's new" if it grew.
 *  A first run with no recorded state is NOT treated as an upgrade — we don't nag
 *  fresh installs with a changelog for a version they just chose. Synchronous and
 *  cheap; call once at startup. */
export function detectUpgrade(): void {
  const { lastVersion } = readState();
  if (lastVersion && compareVersions(currentVersion, lastVersion) > 0) {
    pendingWhatsNew = formatWhatsNew(currentVersion);
    if (pendingWhatsNew) {
      console.error(`[onto-mcp] updated v${lastVersion} → v${currentVersion}`);
    }
  }
  if (lastVersion !== currentVersion) writeState(currentVersion);
}

/** One non-blocking registry lookup for the latest published version. Sets the
 *  update nudge if we're behind. Never throws; safe to call without awaiting. */
export async function startUpdateCheck(): Promise<void> {
  if (process.env.ONTO_NO_UPDATE_CHECK) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(`https://registry.npmjs.org/${PKG}/latest`, {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = (await res.json()) as { version?: string };
    if (data.version && compareVersions(data.version, currentVersion) > 0) {
      latestVersion = data.version;
      console.error(
        `[onto-mcp] update available: v${latestVersion} (you have v${currentVersion}). ` +
          `Restart your MCP client to upgrade.`,
      );
    }
  } catch {
    /* offline, timeout, or abort — stay quiet */
  }
}

/** Compact segment for the Onto report line when a newer version exists, else
 *  null. Reads the cached result — no I/O. */
export function getUpdateNotice(): string | null {
  return latestVersion ? `⬆ v${latestVersion} available, restart to update` : null;
}

/** The queued "what's new" block, returned at most once per process. */
export function consumeWhatsNew(): string | null {
  if (whatsNewConsumed) return null;
  whatsNewConsumed = true;
  const note = pendingWhatsNew;
  pendingWhatsNew = null;
  return note;
}
