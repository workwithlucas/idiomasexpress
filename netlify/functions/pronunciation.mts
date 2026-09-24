// Netlify Function (runtime Node) que expõe o proxy do Azure em /api/pronunciation.
// Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION em
// Site configuration → Environment variables (veja o README).
import type { Config } from '@netlify/functions';
import { handlePronunciation } from '../../server/pronunciation.ts';

export default async (req: Request): Promise<Response> =>
  handlePronunciation(req, {
    key: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
  });

export const config: Config = { path: '/api/pronunciation' };
