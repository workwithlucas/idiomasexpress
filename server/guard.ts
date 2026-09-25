/**
 * Proteções comuns das Functions públicas (/api/pronunciation, /api/sync).
 * Não é autenticação: só impede outros sites e scripts simples de usar o
 * endpoint e limita a frequência por IP.
 */

/** Navegadores sempre mandam Sec-Fetch-Site ou Origin num POST; curl e outros sites não passam. */
export function sameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const own = [new URL(req.url).host, req.headers.get('host'), req.headers.get('x-forwarded-host')];
  return own.includes(host);
}

/** Limite por IP em memória (melhor esforço: cada instância da Function tem a sua). */
export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    limited(req: Request, now = Date.now()): boolean {
      const ip = req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
      const over = recent.length >= limit;
      if (!over) recent.push(now);
      hits.set(ip, recent);
      if (hits.size > 5_000) hits.clear(); // não deixa a memória crescer sem limite
      return over;
    },
    reset: () => hits.clear(),
  };
}
