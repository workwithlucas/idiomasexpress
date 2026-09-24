/**
 * Proxy para o Azure Speech — Pronunciation Assessment (REST, áudio curto).
 *
 * Roda no servidor (middleware do Vite em dev, Netlify Function em produção)
 * para que a chave do Azure nunca seja exposta no navegador.
 *
 * Contrato HTTP (mesmo em dev e produção):
 *   GET  /api/pronunciation                 → { configured: boolean }
 *   POST /api/pronunciation?text=<frase>    corpo: WAV PCM 16 kHz mono 16 bits
 *        → 200 PronunciationResult | 4xx/5xx { error, message }
 *
 * Referência: https://learn.microsoft.com/azure/ai-services/speech-service/rest-speech-to-text-short
 */

export interface AzureConfig {
  key?: string;
  region?: string;
}

export interface PhonemeScore {
  phoneme: string;
  accuracy: number;
}

export interface WordScore {
  word: string;
  accuracy: number;
  /** None | Omission | Insertion | Mispronunciation | UnexpectedBreak | MissingBreak | Monotone */
  errorType: string;
  phonemes: PhonemeScore[];
}

export interface PronunciationResult {
  recognizedText: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  pronunciation: number;
  words: WordScore[];
}

export interface ApiError {
  error: 'not_configured' | 'bad_request' | 'no_speech' | 'auth' | 'upstream' | 'method';
  message: string;
}

const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // ~2 min de PCM 16 kHz; o Azure aceita até 60 s
const MAX_TEXT = 400;
const LOCALE = 'fr-FR';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const err = (error: ApiError['error'], message: string, status: number): Response =>
  json({ error, message } satisfies ApiError, status);

export async function handlePronunciation(req: Request, cfg: AzureConfig): Promise<Response> {
  const configured = Boolean(cfg.key && cfg.region);

  if (req.method === 'GET') return json({ configured });
  if (req.method !== 'POST') return err('method', 'Use GET ou POST.', 405);

  if (!configured) {
    return err(
      'not_configured',
      'Azure Speech não configurado: defina AZURE_SPEECH_KEY e AZURE_SPEECH_REGION (veja o README).',
      503,
    );
  }

  const text = new URL(req.url).searchParams.get('text')?.trim() ?? '';
  if (!text || text.length > MAX_TEXT) return err('bad_request', 'Texto de referência ausente ou longo demais.', 400);

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('audio/wav')) return err('bad_request', 'O áudio deve ser WAV (PCM 16 kHz mono).', 400);

  const audio = await req.arrayBuffer();
  if (audio.byteLength <= 44) return err('bad_request', 'Áudio vazio.', 400);
  if (audio.byteLength > MAX_AUDIO_BYTES) return err('bad_request', 'Áudio longo demais (máx. ~60 s).', 413);

  const assessment = {
    ReferenceText: text,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: true,
  };

  const endpoint =
    `https://${encodeURIComponent(cfg.region!)}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1` +
    `?language=${LOCALE}&format=detailed`;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': cfg.key!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': Buffer.from(JSON.stringify(assessment), 'utf8').toString('base64'),
        Accept: 'application/json',
      },
      body: audio,
      signal: AbortSignal.timeout(25_000),
    });
  } catch (e) {
    if ((e as DOMException)?.name === 'TimeoutError') return err('upstream', 'O Azure demorou demais para responder. Tente de novo.', 504);
    return err('upstream', `Falha de rede ao contatar o Azure: ${(e as Error).message}`, 502);
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return err('auth', 'Chave ou região do Azure inválidas.', 502);
  }
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 300);
    return err('upstream', `Azure respondeu ${upstream.status}: ${detail}`, 502);
  }

  const data = (await upstream.json()) as AzureResponse;
  if (data.RecognitionStatus !== 'Success' || !data.NBest?.length) {
    return err('no_speech', 'Não foi possível reconhecer fala no áudio. Tente de novo, mais perto do microfone.', 422);
  }
  return json(normalizeAzureResponse(data));
}

// ---- Normalização --------------------------------------------------------

/** O Azure já retornou os escores tanto no nível do objeto quanto aninhados em
 *  "PronunciationAssessment", dependendo da versão; aceitamos os dois formatos. */
interface Scores {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ErrorType?: string;
}
interface AzurePhoneme extends Scores {
  Phoneme?: string;
  PronunciationAssessment?: Scores;
}
interface AzureWord extends Scores {
  Word: string;
  PronunciationAssessment?: Scores;
  Phonemes?: AzurePhoneme[];
}
interface AzureNBest extends Scores {
  Display?: string;
  Lexical?: string;
  PronunciationAssessment?: Scores;
  Words?: AzureWord[];
}
export interface AzureResponse {
  RecognitionStatus: string;
  DisplayText?: string;
  NBest?: AzureNBest[];
}

const pick = (o: Scores & { PronunciationAssessment?: Scores }, k: keyof Scores): number => {
  const v = o.PronunciationAssessment?.[k] ?? o[k];
  return typeof v === 'number' ? Math.round(v) : 0;
};

export function normalizeAzureResponse(data: AzureResponse): PronunciationResult {
  const best = data.NBest![0];
  return {
    recognizedText: best.Display ?? data.DisplayText ?? '',
    accuracy: pick(best, 'AccuracyScore'),
    fluency: pick(best, 'FluencyScore'),
    completeness: pick(best, 'CompletenessScore'),
    pronunciation: pick(best, 'PronScore'),
    words: (best.Words ?? []).map((w) => ({
      word: w.Word,
      accuracy: pick(w, 'AccuracyScore'),
      errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? 'None',
      phonemes: (w.Phonemes ?? []).map((p) => ({ phoneme: p.Phoneme ?? '?', accuracy: pick(p, 'AccuracyScore') })),
    })),
  };
}
