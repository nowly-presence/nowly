import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  sourcemap: false,
  target: 'node22',
  shims: true,
  noExternal: ['@nowly/env', '@nowly/locales', '@nowly/shared'],
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    }
  },
})
