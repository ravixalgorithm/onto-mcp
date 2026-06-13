/* Programmatic exports for embedding the Onto tools in custom MCP setups.
 * Most users should run the bin via `npx @ontosdk/mcp`; this file is for
 * power users wiring tools into their own Server instance. */

export { readUrl, readUrlInputSchema, type ReadUrlInput } from './tools/read.js';
export { scoreUrl, scoreUrlInputSchema, type ScoreUrlInput } from './tools/score.js';
export {
  readAndScore,
  readAndScoreInputSchema,
  type ReadAndScoreInput,
} from './tools/read-and-score.js';
export { batchRead, batchInputSchema, type BatchInput } from './tools/batch.js';
export { mapSite, mapInputSchema, type MapInput } from './tools/map.js';
export { extractData, extractInputSchema, type ExtractInput } from './tools/extract.js';
export { callOntoApi, OntoApiError } from './lib/api-client.js';
export type {
  ReadResponse,
  ScoreResponse,
  ReadAndScoreResponse,
  BatchResponse,
  BatchResult,
  MapResponse,
  ExtractResponse,
  Recommendation,
} from './lib/types.js';
export { version } from './lib/version.js';
