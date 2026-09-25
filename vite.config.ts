import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { handlePronunciation, type AzureConfig } from './server/pronunciation.ts';
import { handleSync, memoryStore } from './server/sync.ts';

/**
 * Serve /api/pronunciation e /api/sync durante `vite dev` e `vite preview`,
 * com a mesma lógica das Netlify Functions. A chave do Azure (lida do .env,
 * sem prefixo VITE_) fica só no processo Node e nunca vai para o navegador;
 * a sincronização usa uma loja em memória no lugar do Netlify Blobs.
 */
function localApi(cfg: AzureConfig): Plugin {
  const syncStore = memoryStore();
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? '';
    const isSync = url.startsWith('/api/sync');
    if (!url.startsWith('/api/pronunciation') && !isSync) return next();
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers.set(k, v);
      }
      const request = new Request(new URL(url, `http://${req.headers.host ?? 'localhost'}`), {
        method: req.method,
        headers,
        body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
      });
      const response = isSync ? await handleSync(request, syncStore) : await handlePronunciation(request, cfg);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'upstream', message: (e as Error).message }));
    }
  };
  return {
    name: 'local-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

const seedVersion: number = JSON.parse(readFileSync(new URL('./public/seed/seed.json', import.meta.url), 'utf8')).version;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      __SEED_VERSION__: JSON.stringify(seedVersion),
    },
    plugins: [
      localApi({ key: env.AZURE_SPEECH_KEY, region: env.AZURE_SPEECH_REGION }),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Poliglotas',
          short_name: 'Poliglotas',
          description: 'O francês que já é seu vizinho. Francês para brasileiros que vão morar em Luxemburgo.',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#F4F5F8',
          theme_color: '#F4F5F8',
          categories: ['education'],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell + seed + fontes: tudo pré-cacheado para uso 100% offline.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
          // Subconjuntos de fonte que o conteúdo (pt/fr/IPA) nunca usa: o
          // navegador só os baixaria por unicode-range, então não pré-cacheamos.
          // (O subconjunto "vietnamese" FICA: ele contém o til combinante U+0303
          // das vogais nasais no IPA, como /ɛ̃/, e seria pedido offline.)
          globIgnores: ['**/*-{cyrillic,greek}-*-normal-*.woff2'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    build: {
      target: 'es2022',
    },
    test: {
      include: ['tests/unit/**/*.test.ts'],
      environment: 'node',
    },
  };
});
