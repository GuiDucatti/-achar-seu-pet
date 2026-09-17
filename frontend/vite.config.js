import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (command === 'build' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL precisa ser definida para gerar o frontend de produção.')
  }

  return {
    plugins: [react()],
  }
})
