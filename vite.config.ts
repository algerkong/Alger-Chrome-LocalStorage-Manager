import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        detail: path.resolve(__dirname, 'detail.html'),
        contentScript: path.resolve(__dirname, 'src/contentScript.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
