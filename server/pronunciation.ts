/**
 * Proxy para o Azure Speech — Pronunciation Assessment (REST, áudio curto).
 *
 * Roda no servidor (middleware do Vite em dev, Netlify Function em produção)
 * para que a chave do Azure nunca seja exposta no navegador.
 *
 * Contrato HTTP (mesmo em dev e produção):
 *   GET  /api/pronunciation                 → { configured: boolean, valid: boolean | null }
 *        (valid: a chave foi aceita pelo Azure; null = não deu para conferir agora)
 *   POST /api/pronunciation?text=<frase>    corpo: WAV PCM 16 kHz mono 16 bits
 *        → 200 PronunciationResult | 4xx/5xx { error, message }
 *
 * Referência: https://learn.microsoft.com/azure/ai-services/speech-service/rest-speech-to-text-short
 */
import { checkSpeech, readPcm16Wav } from './audioCheck.ts';
import { rateLimiter, sameOrigin } from './guard.ts';

export interface AzureConfig {
  key?: string;
  region?: string;
  /** Injetável nos testes; padrão: fetch global. */
  fetch?: typeof fetch;
}

export interface PhonemeScore {
  /** Em fr-FR o Azure devolve o fonema SEM rótulo (string vazia): só a nota. */
  phoneme: string;
  accuracy: number;
}

/** Sílaba com as letras que a formam (ex.: "ca", "fé") — o Azure devolve em fr-FR. */
export interface SyllableScore {
  grapheme: string;
  accuracy: number;
}

export interface WordScore {
  word: string;
  accuracy: number;
  /** None | Omission | Insertion | Mispronunciation | UnexpectedBreak | MissingBreak | Monotone */
  errorType: string;
  phonemes: PhonemeScore[];
  syllables: SyllableScore[];
}

export interface PronunciationResult {
  recognizedText: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  pronunciation: number;
  words: WordScore[];
}

export type ApiErrorCode =
  | 'not_configured' // sem chave no servidor
  | 'auth' //           chave ou região recusadas
  | 'quota' //          limite do plano (ex.: 5 h/mês do F0) acabou
  | 'busy' //           muitas chamadas seguidas (429 sem ser cota)
  | 'timeout' //        o Azure não respondeu a tempo
  | 'upstream' //       outro erro do Azure / rede do servidor
  | 'too_short' //      gravação curta demais
  | 'silent' //         gravação sem voz audível
  | 'no_speech' //      o Azure não reconheceu fala
  | 'forbidden' //      pedido de fora do próprio site
  | 'bad_request'
  | 'method';

export interface ApiError {
  error: ApiErrorCode;
  message: string;
}

/** 30 s de PCM 16 kHz mono (o app grava no máximo 15 s). */
const MAX_AUDIO_BYTES = 30 * 16_000 * 2 + 44;
const MAX_TEXT = 400;
const LOCALE = 'fr-FR';
/** Uma frase curta volta em ~1,5 s; passar disso é rede ruim ou Azure lento. */
const UPSTREAM_TIMEOUT_MS = 15_000;
const KEY_CHECK_TTL_MS = 10 * 60_000;
const limiter = rateLimiter(40, 10 * 60_000);

/** Só para testes. */
export function _resetRateLimit(): void {
  limiter.reset();
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const err = (error: ApiErrorCode, message: string, status: number): Response =>
  json({ error, message } satisfies ApiError, status);

/** Resultado da última verificação de chave, por chave+região (evita repetir a cada tela). */
const keyChecks = new Map<string, { valid: boolean; at: number }>();

/**
 * Confere a chave no endpoint de token do Azure: não envia áudio, então não
 * gasta a cota de minutos. true/false = aceita/recusada; null = sem resposta.
 */
async function verifyKey(cfg: AzureConfig): Promise<boolean | null> {
  const id = `${cfg.region}|${cfg.key}`;
  const cached = keyChecks.get(id);
  if (cached && Date.now() - cached.at < KEY_CHECK_TTL_MS) return cached.valid;
  try {
    const res = await (cfg.fetch ?? fetch)(`https://${encodeURIComponent(cfg.region!)}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': cfg.key!, 'Content-Length': '0' },
      signal: AbortSignal.timeout(5_000),
    });
    // 401/403 = chave errada ou de outra região; 200 = ok. 429 (cota/limite) não diz nada sobre a chave.
    const valid = res.ok ? true : res.status === 401 || res.status === 403 ? false : null;
    if (valid !== null) keyChecks.set(id, { valid, at: Date.now() });
    return valid;
  } catch {
    return null;
  }
}

/** Erro HTTP do Azure → código do app. Cota do F0 costuma vir como 403 ou 429 com "quota" no texto. */
export function classifyAzureError(status: number, body: string): ApiErrorCode {
  const quota = /quota|out of call volume/i.test(body);
  if (quota && (status === 403 || status === 429)) return 'quota';
  if (status === 429) return 'busy';
  if (status === 401 || status === 403) return 'auth';
  if (status === 408 || status === 504) return 'timeout';
  return 'upstream';
}

export async function handlePronunciation(req: Request, cfg: AzureConfig): Promise<Response> {
  const configured = Boolean(cfg.key && cfg.region);

  if (req.method === 'GET') return json({ configured, valid: configured ? await verifyKey(cfg) : null });
  if (req.method !== 'POST') return err('method', 'Use GET ou POST.', 405);

  if (!sameOrigin(req)) return err('forbidden', 'Pedido de fora do app.', 403);
  if (limiter.limited(req)) return err('busy', 'Muitas avaliações seguidas; espere alguns minutos.', 429);

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
  if (audio.byteLength <= 44) return err('too_short', 'Áudio vazio.', 422);
  if (audio.byteLength > MAX_AUDIO_BYTES) return err('bad_request', 'Áudio longo demais (máx. 30 s).', 413);

  // Curto ou silencioso: responde aqui mesmo, sem gastar a cota do Azure.
  const pcm = readPcm16Wav(audio);
  if (!pcm) return err('bad_request', 'O áudio deve ser WAV PCM 16 bits mono.', 400);
  const check = checkSpeech(pcm.samples, pcm.sampleRate);
  if (check === 'too_short') return err('too_short', 'Gravação curta demais.', 422);
  if (check === 'silent') return err('silent', 'Não há voz audível na gravação.', 422);

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
    upstream = await (cfg.fetch ?? fetch)(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': cfg.key!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': Buffer.from(JSON.stringify(assessment), 'utf8').toString('base64'),
        Accept: 'application/json',
      },
      body: audio,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') return err('timeout', 'O Azure demorou demais para responder.', 504);
    return err('upstream', `Falha de rede ao contatar o Azure: ${(e as Error).message}`, 502);
  }

  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 300);
    const code = classifyAzureError(upstream.status, detail);
    if (code === 'auth') keyChecks.set(`${cfg.region}|${cfg.key}`, { valid: false, at: Date.now() });
    const messages: Record<ApiErrorCode, string> = {
      quota: 'O limite de uso do plano do Azure acabou.',
      busy: 'Muitas avaliações seguidas; o Azure pediu uma pausa.',
      auth: 'Chave ou região do Azure inválidas.',
      timeout: 'O Azure demorou demais para responder.',
    } as Record<ApiErrorCode, string>;
    const status = code === 'quota' || code === 'busy' ? 429 : code === 'timeout' ? 504 : 502;
    return err(code, `${messages[code] ?? 'Erro do Azure.'} (HTTP ${upstream.status}${detail ? `: ${detail}` : ''})`, status);
  }

  let data: AzureResponse;
  try {
    data = (await upstream.json()) as AzureResponse;
  } catch {
    return err('upstream', 'Resposta do Azure ilegível.', 502);
  }
  if (data.RecognitionStatus !== 'Success' || !data.NBest?.length) {
    return err('no_speech', 'Não foi possível reconhecer fala no áudio.', 422);
  }
  const result = normalizeAzureResponse(data);
  // Silêncio/ruído voltam como "Success" com texto "." e tudo zerado.
  if (!hasSpeech(result)) return err('no_speech', 'Não foi possível reconhecer fala no áudio.', 422);
  return json(result);
}

/** O Azure reconheceu alguma coisa? (texto só com pontuação ou todas as palavras omitidas = não) */
export function hasSpeech(r: PronunciationResult): boolean {
  if (!/[\p{L}\p{N}]/u.test(r.recognizedText)) return false;
  return r.words.some((w) => w.errorType !== 'Omission');
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
interface AzureSyllable extends Scores {
  Syllable?: string;
  Grapheme?: string;
  PronunciationAssessment?: Scores;
}
interface AzureWord extends Scores {
  Word: string;
  PronunciationAssessment?: Scores;
  Phonemes?: AzurePhoneme[];
  Syllables?: AzureSyllable[];
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
      phonemes: (w.Phonemes ?? []).map((p) => ({ phoneme: p.Phoneme ?? '', accuracy: pick(p, 'AccuracyScore') })),
      syllables: (w.Syllables ?? [])
        .map((y) => ({ grapheme: y.Grapheme || y.Syllable || '', accuracy: pick(y, 'AccuracyScore') }))
        .filter((y) => y.grapheme),
    })),
  };
}
