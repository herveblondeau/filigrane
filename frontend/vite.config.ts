import { defineConfig } from 'vite';

const workflowApiUrl = process.env.WORKFLOW_API_URL ?? 'http://localhost:5261';
const workflowApiKey = process.env.WORKFLOW_API_KEY;

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: workflowApiUrl,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (workflowApiKey) {
              proxyReq.setHeader('X-Api-Key', workflowApiKey);
            }
          });
        },
      },
    },
  },
});
