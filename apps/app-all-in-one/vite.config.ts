import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pal/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@pal/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@pal/ipc-types': resolve(__dirname, '../../packages/ipc-types/src/index.ts'),
      '@pal/tool-image': resolve(__dirname, '../../packages/tool-image/src/index.ts'),
      '@pal/tool-font-compress': resolve(__dirname, '../../packages/tool-font-compress/src/index.ts'),
      '@pal/tool-gif-maker': resolve(__dirname, '../../packages/tool-gif-maker/src/index.ts'),
    },
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
})
