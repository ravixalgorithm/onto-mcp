import { defineConfig } from 'tsup';

/* Two configs, run sequentially. We need them separate so the bin entry
 * (server.ts) gets a #!/usr/bin/env node banner while the programmatic
 * entry (index.ts) does not. splitting:false forces a single self-contained
 * file per entry — that's what fixes the npm/Windows npx shim generation
 * issue we hit with the previous multi-file tsc output. */
export default defineConfig([
  {
    entry: { server: 'src/server.ts' },
    format: ['esm'],
    target: 'node20',
    clean: true,
    splitting: false,
    sourcemap: true,
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
    external: ['@modelcontextprotocol/sdk', 'zod'],
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'node20',
    clean: false,
    splitting: false,
    sourcemap: true,
    dts: true,
    external: ['@modelcontextprotocol/sdk', 'zod'],
  },
]);
