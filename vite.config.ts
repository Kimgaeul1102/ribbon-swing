import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // GitHub Pages 등 하위 경로(/저장소이름/)에 올려도 동작하도록 상대 경로
  plugins: [react(), tailwindcss()],
})
