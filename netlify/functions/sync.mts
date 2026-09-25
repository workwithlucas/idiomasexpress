// Netlify Function da sincronização (/api/sync). O Netlify Blobs vem pronto
// para Functions do próprio site: não há chave nem configuração a fazer.
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { handleSync, type SyncDoc, type SyncStore } from '../../server/sync.ts';

const blobs = (): SyncStore => {
  const store = getStore({ name: 'poliglotas-sync', consistency: 'strong' });
  return {
    async read(key) {
      const r = await store.getWithMetadata(key, { type: 'json' });
      return r ? { doc: r.data as SyncDoc, etag: r.etag } : null;
    },
    async write(key, doc, etag) {
      const r = await store.setJSON(key, doc, etag === null ? { onlyIfNew: true } : { onlyIfMatch: etag });
      return r.modified;
    },
  };
};

export default async (req: Request): Promise<Response> => handleSync(req, blobs());

export const config: Config = { path: '/api/sync' };
