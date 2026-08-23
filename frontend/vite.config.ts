import { defineConfig } from 'vite';
import { createApiProxyConfig } from './vite/apiProxy';

export default defineConfig({
  server: {
    proxy: {
      '/api': createApiProxyConfig(process.env),
    },
  },
});
