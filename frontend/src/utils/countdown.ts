export function startCountdown(expiresAt: string, onTick: (remaining: string) => void, onExpired: () => void): () => void {
  const expiry = new Date(expiresAt).getTime();

  const tick = () => {
    const diff = expiry - Date.now();
    if (diff <= 0) {
      onExpired();
      return;
    }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    onTick(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
  };

  tick();
  const id = setInterval(tick, 1_000);
  return () => clearInterval(id);
}
