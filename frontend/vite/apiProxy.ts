import type { ProxyOptions } from 'vite';

export interface ApiProxyEnv {
  WORKFLOW_API_URL?: string;
  WORKFLOW_API_KEY?: string;
}

/**
 * Dev-only proxy config for /api: forwards to Workflow's Main.Api and injects
 * X-Api-Key server-side, so the browser never sees the key.
 */
export function createApiProxyConfig(env: ApiProxyEnv): ProxyOptions {
  const target = env.WORKFLOW_API_URL ?? 'http://localhost:5261';
  const apiKey = env.WORKFLOW_API_KEY;

  return {
    target,
    changeOrigin: true,
    configure: (proxy) => {
      if (!apiKey) return;
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('X-Api-Key', apiKey);
      });
    },
  };
}
