import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget =
    env.VITE_BACKEND_URL ||
    (env.VITE_API_BASE_URL ? env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') : '') ||
    'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-recharts': ['recharts'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
