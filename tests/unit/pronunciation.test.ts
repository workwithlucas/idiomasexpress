import { describe, expect, it } from 'vitest';
import { _resetRateLimit, classifyAzureError, handlePronunciation, normalizeAzureResponse } from '../../server/pronunciation';
import { readFileSync } from 'node:fs';
import { checkSpeech, readPcm16Wav } from '../../server/audioCheck';
import { encodePcm16Wav } from '../../src/lib/wav';
import { scoredWords } from '../../src/lib/pronunciationHistory';
import type { Word } from '../../src/db/schema';

const RATE = 16000;
/** "Voz" sintética: 220 Hz com envelope, `secs` segundos, meio segundo de silêncio em volta. */
function voice(secs: number, amp = 0.3): Float32Array {
  const pad = RATE / 2;
  const n = Math.round(secs * RATE);
  const out = new Float32Array(n + pad * 2);
  for (let i = 0; i < n; i++) out[pad + i] = amp * Math.sin((2 * Math.PI * 220 * i) / RATE) * Math.sin((Math.PI * i) / n);
  return out;
}
const wavBody = (samples: Float32Array) => new Blob([encodePcm16Wav(samples, RATE)]);
/** POST como o navegador manda de dentro do app (mesma origem). */
const post = (samples: Float32Array, text = 'Je voudrais un café.', headers: Record<string, string> = { 'sec-fetch-site': 'same-origin' }) =>
  new Request(`http://x/api/pronunciation?text=${encodeURIComponent(text)}`, { method: 'POST', headers: { 'content-type': 'audio/wav', ...headers }, body: wavBody(samples) });

/** fetch falso: devolve a resposta dada (ou lança o erro) e conta as chamadas. */
function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: string[] = [];
  const f = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return respond();
  }) as typeof fetch;
  return { f, calls };
}

const azureOk = {
  RecognitionStatus: 'Success',
  NBest: [{ Display: 'Je voudrais un café.', AccuracyScore: 92, FluencyScore: 100, CompletenessScore: 100, PronScore: 95,
    Words: [
      { Word: 'Je', AccuracyScore: 88, ErrorType: 'None', Phonemes: [{ Phoneme: '', AccuracyScore: 80 }] },
      { Word: 'café', AccuracyScore: 64, ErrorType: 'Mispronunciation', Syllables: [{ Syllable: '', Grapheme: 'ca', AccuracyScore: 100 }, { Syllable: '', Grapheme: 'fé', AccuracyScore: 41 }] },
    ] }],
};
/** O que o Azure real devolve para silêncio/ruído: "Success", texto "." e tudo zerado. */
const azureNothing = {
  RecognitionStatus: 'Success', DisplayText: '.',
  NBest: [{ Display: '.', AccuracyScore: 0, FluencyScore: 0, CompletenessScore: 0, PronScore: 0,
    Words: [{ Word: 'je', AccuracyScore: 0, ErrorType: 'Omission' }, { Word: 'café', AccuracyScore: 0, ErrorType: 'Omission' }] }],
};
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('proxy Azure', () => {
  it('GET informa se está configurado e se a chave foi aceita (sem gastar cota)', async () => {
    const r1 = await handlePronunciation(new Request('http://x/api/pronunciation'), {});
    expect(await r1.json()).toEqual({ configured: false, valid: null });

    const ok = fakeFetch(() => new Response('token', { status: 200 }));
    const r2 = await handlePronunciation(new Request('http://x/api/pronunciation'), { key: 'k-ok', region: 'francecentral', fetch: ok.f });
    expect(await r2.json()).toEqual({ configured: true, valid: true });
    expect(ok.calls[0]).toContain('francecentral.api.cognitive.microsoft.com/sts/v1.0/issueToken');

    const bad = fakeFetch(() => new Response('', { status: 401 }));
    const r3 = await handlePronunciation(new Request('http://x/api/pronunciation'), { key: 'k-ruim', region: 'francecentral', fetch: bad.f });
    expect(await r3.json()).toEqual({ configured: true, valid: false });

    const down = fakeFetch(() => { throw new TypeError('fetch failed'); });
    const r4 = await handlePronunciation(new Request('http://x/api/pronunciation'), { key: 'k-sem-rede', region: 'francecentral', fetch: down.f });
    expect(await r4.json()).toEqual({ configured: true, valid: null });
  });

  it('POST sem chave → 503 not_configured (a chave nunca vem do cliente)', async () => {
    const res = await handlePronunciation(new Request('http://x/api/pronunciation?text=bonjour', { method: 'POST', body: 'x', headers: { origin: 'http://x' } }), {});
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('not_configured');
  });

  it('valida texto e formato', async () => {
    const cfg = { key: 'k', region: 'westeurope' };
    const noText = await handlePronunciation(new Request('http://x/api/pronunciation', { method: 'POST', body: 'x', headers: { 'sec-fetch-site': 'same-origin' } }), cfg);
    expect(noText.status).toBe(400);
    const wrongType = await handlePronunciation(
      new Request('http://x/api/pronunciation?text=oui', { method: 'POST', body: 'x', headers: { 'content-type': 'audio/webm', 'sec-fetch-site': 'same-origin' } }),
      cfg,
    );
    expect(wrongType.status).toBe(400);
  });

  it('normaliza os dois formatos de resposta do Azure', () => {
    const flat = normalizeAzureResponse({
      RecognitionStatus: 'Success',
      NBest: [{ Display: 'Bonjour.', AccuracyScore: 91.4, FluencyScore: 88, CompletenessScore: 100, PronScore: 90.2,
        Words: [{ Word: 'bonjour', AccuracyScore: 91.4, ErrorType: 'None', Phonemes: [{ Phoneme: 'b', AccuracyScore: 99 }] }] }],
    });
    expect(flat).toMatchObject({ recognizedText: 'Bonjour.', accuracy: 91, pronunciation: 90, words: [{ word: 'bonjour', accuracy: 91, phonemes: [{ phoneme: 'b', accuracy: 99 }] }] });

    const nested = normalizeAzureResponse({
      RecognitionStatus: 'Success',
      NBest: [{ Display: 'Oui.', PronunciationAssessment: { AccuracyScore: 70, FluencyScore: 60, CompletenessScore: 100, PronScore: 72 },
        Words: [{ Word: 'oui', PronunciationAssessment: { AccuracyScore: 55, ErrorType: 'Mispronunciation' } }] }],
    });
    expect(nested.words[0]).toEqual({ word: 'oui', accuracy: 55, errorType: 'Mispronunciation', phonemes: [], syllables: [] });
    expect(nested.fluency).toBe(60);
  });
});

describe('proxy Azure: endpoint público protegido', () => {
  it('recusa POST de outro site ou sem origem, sem chamar o Azure', async () => {
    const ff = fakeFetch(() => jsonRes(azureOk));
    const c = { key: 'k', region: 'francecentral', fetch: ff.f };
    const other = await handlePronunciation(post(voice(1.5), undefined, { 'sec-fetch-site': 'cross-site' }), c);
    expect(other.status).toBe(403);
    expect((await other.json()).error).toBe('forbidden');
    expect((await handlePronunciation(post(voice(1.5), undefined, { origin: 'https://malicioso.example' }), c)).status).toBe(403);
    expect((await handlePronunciation(post(voice(1.5), undefined, {}), c)).status).toBe(403); // curl, sem cabeçalhos
    expect((await handlePronunciation(post(voice(1.5), undefined, { origin: 'http://x' }), c)).status).toBe(200); // mesma origem (Safari antigo)
    expect(ff.calls.filter((u) => u.includes('stt.speech'))).toHaveLength(1);
  });

  it('limita avaliações seguidas por IP (429 busy)', async () => {
    _resetRateLimit();
    const ff = fakeFetch(() => jsonRes(azureOk));
    const c = { key: 'k', region: 'francecentral', fetch: ff.f };
    const h = { 'sec-fetch-site': 'same-origin', 'x-nf-client-connection-ip': '203.0.113.9' };
    const statuses: number[] = [];
    for (let i = 0; i < 41; i++) statuses.push((await handlePronunciation(post(voice(0.8), undefined, h), c)).status);
    expect(statuses.slice(0, 40).every((s) => s === 200)).toBe(true);
    expect(statuses[40]).toBe(429);
    // Outro IP continua livre.
    expect((await handlePronunciation(post(voice(0.8), undefined, { ...h, 'x-nf-client-connection-ip': '203.0.113.10' }), c)).status).toBe(200);
    _resetRateLimit();
  });
});

describe('proxy Azure: casos de uso real', () => {
  const cfg = (respond: () => Response | Promise<Response>) => {
    const ff = fakeFetch(respond);
    return { cfg: { key: 'k', region: 'francecentral', fetch: ff.f }, calls: ff.calls };
  };

  it('caminho feliz: notas por palavra e por sílaba (com as letras)', async () => {
    const { cfg: c } = cfg(() => jsonRes(azureOk));
    const res = await handlePronunciation(post(voice(1.5)), c);
    expect(res.status).toBe(200);
    const r = await res.json();
    expect(r.pronunciation).toBe(95);
    expect(r.words[1]).toMatchObject({ word: 'café', accuracy: 64, errorType: 'Mispronunciation', syllables: [{ grapheme: 'ca', accuracy: 100 }, { grapheme: 'fé', accuracy: 41 }] });
  });

  it('áudio curto ou silencioso volta 422 SEM chamar o Azure (não gasta cota)', async () => {
    const { cfg: c, calls } = cfg(() => jsonRes(azureOk));
    const short = await handlePronunciation(post(new Float32Array(RATE * 0.3).fill(0.2)), c);
    expect(short.status).toBe(422);
    expect((await short.json()).error).toBe('too_short');
    const silent = await handlePronunciation(post(new Float32Array(RATE * 2)), c);
    expect((await silent.json()).error).toBe('silent');
    const whisper = await handlePronunciation(post(voice(1.5, 0.004)), c);
    expect((await whisper.json()).error).toBe('silent');
    expect(calls).toHaveLength(0);
  });

  it('Azure não reconheceu nada ("." e tudo zerado) → no_speech, não "nota 0"', async () => {
    const { cfg: c } = cfg(() => jsonRes(azureNothing));
    const res = await handlePronunciation(post(voice(1.5)), c);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('no_speech');
    const { cfg: c2 } = cfg(() => jsonRes({ RecognitionStatus: 'InitialSilenceTimeout' }));
    expect((await (await handlePronunciation(post(voice(1.5)), c2)).json()).error).toBe('no_speech');
  });

  it('chave recusada → auth; cota → quota; limite de ritmo → busy', async () => {
    const auth = await handlePronunciation(post(voice(1.5)), cfg(() => new Response('', { status: 401 })).cfg);
    expect((await auth.json()).error).toBe('auth');
    const quota = await handlePronunciation(post(voice(1.5)), cfg(() => new Response('{"error":{"code":"403","message":"Out of call volume quota for SpeechServices F0 pricing tier."}}', { status: 403 })).cfg);
    expect(quota.status).toBe(429);
    expect((await quota.json()).error).toBe('quota');
    const busy = await handlePronunciation(post(voice(1.5)), cfg(() => new Response('Too many requests', { status: 429 })).cfg);
    expect((await busy.json()).error).toBe('busy');
  });

  it('Azure lento → timeout (504), sem travar', async () => {
    const res = await handlePronunciation(post(voice(1.5)), cfg(() => { throw new DOMException('timeout', 'TimeoutError'); }).cfg);
    expect(res.status).toBe(504);
    expect((await res.json()).error).toBe('timeout');
    const net = await handlePronunciation(post(voice(1.5)), cfg(() => { throw new TypeError('fetch failed'); }).cfg);
    expect((await net.json()).error).toBe('upstream');
  });

  it('classifica erros HTTP do Azure', () => {
    expect(classifyAzureError(429, 'Quota exceeded')).toBe('quota');
    expect(classifyAzureError(403, 'Out of call volume quota')).toBe('quota');
    expect(classifyAzureError(403, '')).toBe('auth');
    expect(classifyAzureError(401, '')).toBe('auth');
    expect(classifyAzureError(429, '')).toBe('busy');
    expect(classifyAzureError(504, '')).toBe('timeout');
    expect(classifyAzureError(500, 'x')).toBe('upstream');
  });
});

describe('checagem da gravação', () => {
  it('aceita voz normal; recusa curta, muda, quase sem voz e sussurro inaudível', () => {
    expect(checkSpeech(voice(1.2), RATE)).toBe('ok');
    expect(checkSpeech(new Float32Array(RATE * 0.3).fill(0.2), RATE)).toBe('too_short');
    expect(checkSpeech(new Float32Array(RATE * 2), RATE)).toBe('silent');
    expect(checkSpeech(voice(0.1), RATE)).toBe('silent'); // 0,1 s de voz em 1,1 s de gravação
    expect(checkSpeech(voice(1.5, 0.004), RATE)).toBe('silent');
  });

  it('a voz sintética do microfone falso dos testes E2E passa na checagem', () => {
    const buf = readFileSync(new URL('../fixtures/voz-sintetica.wav', import.meta.url));
    const pcm = readPcm16Wav(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    expect(pcm).not.toBeNull();
    expect(checkSpeech(pcm!.samples, pcm!.sampleRate)).toBe('ok');
  });
});

describe('histórico de pronúncia', () => {
  const words = [
    { id: 'w_je', fr: 'je' }, { id: 'w_cafe', fr: 'café' }, { id: 'w_la', fr: 'la' }, { id: 'w_la_2', fr: 'là' },
    { id: 'w_s_il_vous_plait', fr: "s'il vous plaît" },
  ] as Word[];
  const result = normalizeAzureResponse(azureOk as never);

  it('frase: um registro por palavra do banco, com as sílabas', () => {
    const s = scoredWords(result, words);
    expect(s.map((x) => [x.word_id, x.score])).toEqual([['w_je', 88], ['w_cafe', 64]]);
    expect(s[1]).toMatchObject({ error_type: 'Mispronunciation', syllables: [{ grapheme: 'ca', accuracy: 100 }, { grapheme: 'fé', accuracy: 41 }] });
  });

  it('palavra/expressão do banco gravada sozinha: um registro com a nota geral', () => {
    const s = scoredWords(result, words, 'w_s_il_vous_plait');
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ word_id: 'w_s_il_vous_plait', score: 95, error_type: 'Mispronunciation' });
  });

  it('acento conta: "la" e "là" são palavras diferentes', () => {
    const r = { ...result, words: [{ word: 'Là', accuracy: 70, errorType: 'None', phonemes: [], syllables: [] }] };
    expect(scoredWords(r, words).map((x) => x.word_id)).toEqual(['w_la_2']);
  });
});

describe('WAV', () => {
  it('gera cabeçalho PCM 16 kHz mono correto', () => {
    const buf = encodePcm16Wav(new Float32Array([0, 0.5, -1, 1]), 16000);
    const v = new DataView(buf);
    const tag = (o: number) => String.fromCharCode(...new Uint8Array(buf, o, 4));
    expect(tag(0)).toBe('RIFF');
    expect(tag(8)).toBe('WAVE');
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(8);
    expect(v.getInt16(48, true)).toBe(-32768);
    expect(buf.byteLength).toBe(52);
  });
});
