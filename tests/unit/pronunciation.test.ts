import { describe, expect, it } from 'vitest';
import { handlePronunciation, normalizeAzureResponse } from '../../server/pronunciation';
import { encodePcm16Wav } from '../../src/lib/wav';

describe('proxy Azure', () => {
  it('GET informa se está configurado', async () => {
    const r1 = await handlePronunciation(new Request('http://x/api/pronunciation'), {});
    expect(await r1.json()).toEqual({ configured: false });
    const r2 = await handlePronunciation(new Request('http://x/api/pronunciation'), { key: 'k', region: 'westeurope' });
    expect(await r2.json()).toEqual({ configured: true });
  });

  it('POST sem chave → 503 not_configured (a chave nunca vem do cliente)', async () => {
    const res = await handlePronunciation(new Request('http://x/api/pronunciation?text=bonjour', { method: 'POST', body: 'x' }), {});
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('not_configured');
  });

  it('valida texto e formato', async () => {
    const cfg = { key: 'k', region: 'westeurope' };
    const noText = await handlePronunciation(new Request('http://x/api/pronunciation', { method: 'POST', body: 'x' }), cfg);
    expect(noText.status).toBe(400);
    const wrongType = await handlePronunciation(
      new Request('http://x/api/pronunciation?text=oui', { method: 'POST', body: 'x', headers: { 'content-type': 'audio/webm' } }),
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
    expect(nested.words[0]).toEqual({ word: 'oui', accuracy: 55, errorType: 'Mispronunciation', phonemes: [] });
    expect(nested.fluency).toBe(60);
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
