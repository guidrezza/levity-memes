import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      'onnxruntime-web/webgpu': 'onnxruntime-web'
    }
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal', 'svelte-konva']
  }
})
