import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Skip DTS generation for now
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@drywall/core', '@drywall/types'],
});
