import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(['index', 'v1', 'v2', 'v3'].map((n) => [n, resolve(__dirname, `${n}.html`)])),
    },
  },
})
