/* Per-version release highlights, shown once to the user after the MCP server
 * upgrades to a new version (see update-check.ts → detectUpgrade). Keep each
 * entry to a few user-facing bullets: what an Onto user would actually care
 * about, not internal refactors. Newest version goes at the top.
 *
 * When you cut a release: bump src/lib/version.ts + package.json, then add the
 * matching entry here so users get a "what's new" note on their next run. */
export const CHANGELOG: Record<string, string[]> = {
  '1.5.0': [
    "You'll now see a heads-up when a newer Onto version is published — a compact nudge on the Onto report line so you know to restart your client to upgrade.",
    'After an upgrade, the first response shows a short "what\'s new" note like this one.',
    'Set ONTO_NO_UPDATE_CHECK=1 to disable the version check entirely.',
  ],
  '1.4.0': [
    'extract_data now takes a `fresh` flag to bypass the cache.',
    'PDFs read cleanly — text is extracted and the AIO score is reported as not-applicable instead of a confusing null/100.',
    'The server now asks your client to preserve the one-line Onto report.',
  ],
};

/** Highlights for a version, or null if none are recorded. */
export function notesFor(version: string): string[] | null {
  const notes = CHANGELOG[version];
  return notes && notes.length > 0 ? notes : null;
}

/** A compact, ready-to-show "what's new" block, or null if nothing recorded. */
export function formatWhatsNew(version: string): string | null {
  const notes = notesFor(version);
  if (!notes) return null;
  const bullets = notes.map((n) => `  • ${n}`).join('\n');
  return `🎉 Onto MCP updated to v${version}. What's new:\n${bullets}`;
}
