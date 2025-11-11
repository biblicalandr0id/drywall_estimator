import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Skip DTS generation for now to avoid tsconfig issues
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
