import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { createApiProxyConfig } from './apiProxy';

function fakeProxy() {
  const handlers: Record<string, (...args: never[]) => void> = {};
  return {
    on: (event: string, handler: (...args: never[]) => void) => {
      handlers[event] = handler;
    },
    emit: (event: string, ...args: unknown[]) =>
      (handlers[event] as (...args: unknown[]) => void)?.(...args),
  };
}

describe('createApiProxyConfig', () => {
  it('targets the configured Workflow URL', () => {
    const config = createApiProxyConfig({ WORKFLOW_API_URL: 'http://example:1234' });
    expect(config.target).toBe('http://example:1234');
  });

  it('defaults to localhost:5261 when no URL is set', () => {
    const config = createApiProxyConfig({});
    expect(config.target).toBe('http://localhost:5261');
  });

  it('injects X-Api-Key on proxied requests when a key is configured', () => {
    const config = createApiProxyConfig({ WORKFLOW_API_KEY: 'secret' });
    const proxy = fakeProxy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.configure?.(proxy as any, {} as any);

    const setHeader = vi.fn();
    proxy.emit('proxyReq', { setHeader } as unknown as IncomingMessage);

    expect(setHeader).toHaveBeenCalledWith('X-Api-Key', 'secret');
  });

  it('does not attach a proxyReq handler when no key is configured', () => {
    const config = createApiProxyConfig({});
    const proxy = fakeProxy();
    const onSpy = vi.spyOn(proxy, 'on');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.configure?.(proxy as any, {} as any);

    expect(onSpy).not.toHaveBeenCalled();
  });
});
