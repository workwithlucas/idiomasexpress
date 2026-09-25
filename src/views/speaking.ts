import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity, savePronunciation } from '../db/repo';
import { currentUser } from '../ui/session';
import { playButton } from '../ui/components';
import { getNativeTiming, speak, stopSpeaking } from '../lib/tts';
import { describeMicError, recordingSupported, recordingUnavailableReason, VoiceRecorder } from '../lib/recorder';
import { decodeMono16k, encodePcm16Wav, WAV_RATE } from '../lib/wav';
import {
  assessPronunciation, azureStatus, checkSpeech, describePronunciationError, PronunciationError,
  type AzureStatus, type PronunciationErrorCode, type PronunciationResult, type SpeechCheck, type WordScore,
} from '../lib/pronunciation';
import { fillFrame, pickRandom, primaryPt } from '../lib/text';
import { PitchTracker } from '../lib/pitchTracker';
import { analyzeSamples } from '../lib/pitch';
import { compareProsody, targetContour, userContour, type UserContour } from '../lib/prosody';
import { prosodyChart } from '../ui/prosodyChart';
import { frenchSentence, liaisonNote } from '../exercises/common';
import { cue } from '../lib/sounds';

interface Target {
  text: string;
  pt?: string;
  wordId?: string;
}

const MAX_SECONDS = 15;

const ERROR_LABELS: Record<string, string> = {
  Mispronunciation: 'soou diferente',
  Omission: 'faltou',
  Insertion: 'a mais',
  UnexpectedBreak: 'pausa',
  MissingBreak: 'sem pausa',
  Monotone: 'sem melodia',
};

/** Abaixo disto (ou com erro apontado pelo Azure) a palavra/sílaba ganha destaque. */
const FOCUS_BELOW = 80;
const needsWork = (w: WordScore) => w.errorType !== 'None' || w.accuracy < FOCUS_BELOW;

function verdict(score: number): string {
  return score >= 85 ? 'Dá pra entender bem' : score >= 60 ? 'Dá pra entender' : 'Ainda difícil de entender';
}

function randomWord(): Target {
  const pool = content().words.filter((w) => w.freq_rank <= 300 && w.fr.length >= 3);
  const w = pickRandom(pool);
  return { text: w.fr, pt: w.pt, wordId: w.id };
}

function randomSentence(): Target {
  const c = content();
  const frame = pickRandom(c.frames);
  const word = c.wordById.get(pickRandom(frame.slot_pool_ids))!;
  return { text: fillFrame(frame.template, word.fr), pt: fillFrame(frame.pt, primaryPt(word)) };
}

export const speakingView: View = ({ query }) => {
  const fromQuery = query.get('texto');
  let target: Target = fromQuery ? { text: fromQuery.slice(0, 200) } : randomSentence();
  const recorder = new VoiceRecorder();
  const tracker = new PitchTracker();
  let recordingUrl: string | null = null;
  let recordedBlob: Blob | null = null;
  /** Amostras 16 kHz da gravação (decodificadas uma vez; usadas na checagem, na melodia e no WAV). */
  let recordedSamples: Float32Array | null = null;
  let speech: SpeechCheck | null = null;
  let timer: number | undefined;
  /** 'quota' e 'invalid_key' valem até sair da tela: não adianta insistir. */
  let azure: AzureStatus | 'checking' | 'quota' = 'checking';
  let starting = false;
  let left = false; // saiu da tela enquanto o pedido de permissão estava aberto
  let attempt = 0; // descarta resultados de uma gravação antiga

  const targetBox = h('div', { class: 'stack stack--sm' });
  const recorderBox = h('div');
  const errorBox = h('div');
  const resultBox = h('section', { class: 'stack', 'data-testid': 'speak-result' });
  const prosodyBox = h('div');
  const azureBox = h('div');

  const resetRecording = () => {
    attempt++;
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = null;
    recordedBlob = null;
    recordedSamples = null;
    speech = null;
    render(errorBox);
    render(resultBox);
  };

  const setTarget = (t: Target) => {
    target = t;
    resetRecording();
    renderTarget();
    renderRecorder('idle');
  };

  const renderTarget = () =>
    render(
      targetBox,
      h(
        'div',
        { class: 'card target' },
        h('p', { class: 'eyebrow' }, 'Ouça'),
        h('div', { 'data-testid': 'speak-target' }, frenchSentence(target.text, 'fr-sentence--big')),
        target.pt && h('p', { class: 'target__meta' }, target.pt),
        liaisonNote(target.text),
        h(
          'div',
          { class: 'row' },
          playButton(target.text, { wordId: target.wordId, size: 'lg', label: 'Ouvir' }),
          playButton(target.text, { wordId: target.wordId, size: 'lg', rate: 0.65, label: 'Ouvir devagar' }),
        ),
      ),
      h(
        'div',
        { class: 'row row--wrap' },
        h('button', { class: 'chip-btn', type: 'button', onclick: () => setTarget(randomSentence()), 'data-testid': 'another-sentence' }, 'Outra frase'),
        h('button', { class: 'chip-btn', type: 'button', onclick: () => setTarget(randomWord()), 'data-testid': 'another-word' }, 'Uma palavra'),
      ),
    );

  const renderRecorder = (state: 'idle' | 'starting' | 'recording' | 'recorded', seconds = 0) => {
    if (!recordingSupported) {
      render(recorderBox, h('div', { class: 'callout callout--warn', 'data-testid': 'rec-unavailable' }, icon('alert', 20), h('p', null, recordingUnavailableReason())));
      return;
    }
    const mainBtn =
      state === 'recording'
        ? h('button', { class: 'rec rec--on', type: 'button', onclick: stopRecording, 'aria-label': 'Parar', 'data-testid': 'rec-stop' }, icon('stop', 30))
        : h('button', { class: 'rec', type: 'button', onclick: startRecording, disabled: state === 'starting', 'aria-label': state === 'recorded' ? 'Gravar de novo' : 'Gravar', 'data-testid': 'rec-start' }, icon('mic', 30));
    render(
      recorderBox,
      h(
        'div',
        { class: 'card recorder' },
        h(
          'div',
          { class: 'recorder__main' },
          mainBtn,
          h(
            'p',
            { class: 'recorder__status' },
            state === 'recording'
              ? h('span', { class: 'rec-dot' }, `Gravando… ${seconds}s`)
              : state === 'starting'
                ? 'Liberando o microfone…'
                : state === 'recorded'
                  ? 'Toque para gravar de novo.'
                  : 'Toque e fale.',
          ),
        ),
        recordingUrl && state !== 'recording' && h('audio', { class: 'recorder__audio', controls: true, src: recordingUrl, 'data-testid': 'own-recording' }),
      ),
    );
  };

  const startRecording = async () => {
    if (starting || recorder.recording) return; // toque duplo não abre dois microfones
    starting = true;
    resetRecording();
    stopSpeaking();
    tracker.prepare(); // precisa acontecer dentro do toque (iOS)
    renderRecorder('starting');
    try {
      await recorder.start();
    } catch (e) {
      renderRecorder('idle');
      render(errorBox, h('div', { class: 'callout callout--error', 'data-testid': 'mic-error' }, icon('alert', 20), h('p', null, describeMicError(e))));
      return;
    } finally {
      starting = false;
    }
    if (left) {
      recorder.release();
      return;
    }
    if (recorder.mediaStream) {
      try {
        tracker.start(recorder.mediaStream);
      } catch (e) {
        console.warn('Melodia ao vivo indisponível; usando a gravação.', e);
      }
    }
    cue('tap');
    let seconds = 0;
    renderRecorder('recording', 0);
    timer = window.setInterval(() => {
      seconds++;
      if (seconds >= MAX_SECONDS) void stopRecording();
      else renderRecorder('recording', seconds);
    }, 1000);
  };

  const stopRecording = async () => {
    window.clearInterval(timer);
    const frames = tracker.stop();
    const myAttempt = attempt;
    try {
      recordedBlob = await recorder.stop();
      recordingUrl = URL.createObjectURL(recordedBlob);
      void logActivity(currentUser().id, 'speaking', 'record', { word_id: target.wordId });
      renderRecorder('recorded');
      renderResultShell();
      const blob = recordedBlob;
      const samples = await decodeMono16k(blob).catch((e) => {
        console.warn('Não foi possível decodificar a gravação.', e);
        return null;
      });
      if (myAttempt !== attempt) return;
      recordedSamples = samples;
      speech = samples ? checkSpeech(samples, WAV_RATE) : null;
      renderAzurePanel();
      // Melodia e nota são independentes: a melodia é local e sai sempre.
      void showProsody(samples, frames, myAttempt);
    } catch (e) {
      renderRecorder('idle');
      render(errorBox, h('div', { class: 'callout callout--error' }, icon('alert', 20), h('p', null, (e as Error).message)));
    }
  };

  const renderResultShell = () => {
    render(resultBox, prosodyBox, azureBox);
    render(prosodyBox, h('div', { class: 'card loading' }, 'Desenhando sua melodia…'));
    renderAzurePanel();
  };

  const showProsody = async (samples: Float32Array | null, liveFrames: ReturnType<PitchTracker['stop']>, myAttempt: number) => {
    let user: UserContour | null = userContour(liveFrames);
    if (!user && samples) {
      // Plano B: analisa o arquivo gravado (mesmo algoritmo, sem depender do tempo real).
      try {
        user = userContour(analyzeSamples(samples, WAV_RATE));
      } catch (e) {
        console.warn('Não foi possível analisar a gravação.', e);
      }
    }
    if (myAttempt !== attempt) return;
    if (!user) {
      render(
        prosodyBox,
        h('div', { class: 'card prosody', 'data-testid': 'prosody' }, h('p', { class: 'eyebrow' }, 'Sua melodia'), h('p', { class: 'muted', 'data-testid': 'prosody-empty' }, 'Não deu pra ouvir sua voz direito. Tente mais perto do microfone.')),
      );
      return;
    }
    const tgt = targetContour(target.text, getNativeTiming(target.text));
    const fb = compareProsody(tgt, user);
    render(
      prosodyBox,
      h(
        'div',
        { class: 'card prosody', 'data-testid': 'prosody' },
        h('p', { class: 'eyebrow' }, 'Sua melodia'),
        prosodyChart(tgt, user),
        h(
          'ul',
          { class: 'prosody__tips', 'data-testid': 'prosody-tips' },
          fb.lines.map((l, i) => h('li', { class: (i === 0 ? fb.melodyOk : fb.rhythmOk) ? 'tip tip--ok' : 'tip' }, l)),
        ),
      ),
    );
  };

  const note = (code: PronunciationErrorCode, testid = 'azure-status') => {
    const d = describePronunciationError(code);
    return h(
      'div',
      { class: 'soft-note', 'data-testid': testid, dataset: { code } },
      icon('info', 16),
      h('span', null, d.text),
      d.retry && h('button', { class: 'chip-btn', type: 'button', onclick: evaluate, 'data-testid': 'assess-retry' }, 'Tentar de novo'),
    );
  };

  const renderAzurePanel = () => {
    if (!recordedBlob) return;
    // Curta ou silenciosa: pede outra gravação antes de gastar a cota do Azure.
    if (speech === 'too_short' || speech === 'silent') {
      render(azureBox, note(speech, 'recording-check'));
      return;
    }
    if (azure === 'checking') return;
    if (azure === 'configured') {
      render(
        azureBox,
        h('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: evaluate, 'data-testid': 'evaluate' }, 'Ver nota da pronúncia'),
      );
      return;
    }
    const code: Record<Exclude<typeof azure, 'configured' | 'checking'>, PronunciationErrorCode> = {
      not_configured: 'not_configured',
      invalid_key: 'auth',
      quota: 'quota',
      offline: 'offline',
      unreachable: 'upstream',
    };
    render(azureBox, note(code[azure]));
  };

  const evaluate = async () => {
    if (!recordedBlob) return;
    const myAttempt = attempt;
    render(azureBox, h('div', { class: 'card loading', 'data-testid': 'assess-loading' }, 'Calculando a nota…'));
    try {
      const samples = recordedSamples ?? (await decodeMono16k(recordedBlob));
      const wav = new Blob([encodePcm16Wav(samples, WAV_RATE)], { type: 'audio/wav' });
      const result = await assessPronunciation(wav, target.text);
      if (myAttempt !== attempt) return;
      const userId = currentUser().id;
      void logActivity(userId, 'speaking', 'assess', { word_id: target.wordId, score: result.pronunciation });
      // Histórico por palavra (para ver a evolução depois); falhar aqui não atrapalha a nota.
      void savePronunciation(userId, target.text, result, target.wordId).catch((e) => console.warn('Histórico de pronúncia não salvo.', e));
      renderScore(result);
    } catch (e) {
      if (myAttempt !== attempt) return;
      console.warn('Nota de pronúncia indisponível:', e);
      const code: PronunciationErrorCode = e instanceof PronunciationError ? e.code : 'upstream';
      // Chave recusada ou cota esgotada: desliga a nota nesta tela, sem insistir.
      if (code === 'auth') azure = 'invalid_key';
      if (code === 'quota') azure = 'quota';
      if (code === 'not_configured') azure = 'not_configured';
      render(azureBox, note(code, 'assess-error'));
    }
  };

  const renderScore = (r: PronunciationResult) => {
    const detail = h('div', { class: 'phonemes', 'data-testid': 'word-detail' });
    const showWord = (w: WordScore) => {
      // Sílabas com as letras (fr-FR não traz o nome do fonema). A(s) pior(es) em destaque.
      const syl = w.syllables ?? [];
      const parts = syl.length ? syl.map((y) => ({ label: y.grapheme, accuracy: y.accuracy })) : (w.phonemes ?? []).filter((p) => p.phoneme).map((p) => ({ label: p.phoneme, accuracy: p.accuracy }));
      const min = Math.min(...parts.map((p) => p.accuracy));
      render(
        detail,
        h('div', { class: 'phonemes__head' }, h('strong', { lang: 'fr' }, w.word), playButton(w.word, { size: 'sm' }), h('span', { class: `score-tag${needsWork(w) ? ' score-tag--focus' : ''}` }, `${w.accuracy}`)),
        parts.length > 1 &&
          h(
            'ul',
            { class: 'phonemes__list', 'data-testid': 'syllables' },
            parts.map((p) => h('li', { class: `phoneme${p.accuracy < FOCUS_BELOW && p.accuracy === min ? ' phoneme--focus' : ''}` }, h('span', { class: 'phoneme__sym', lang: 'fr' }, p.label), h('span', null, String(p.accuracy)))),
          ),
        w.errorType !== 'None' && h('p', { class: 'hint' }, `O Azure marcou: ${ERROR_LABELS[w.errorType] ?? 'diferente'}.`),
      );
    };
    const focus = r.words.filter(needsWork);
    render(
      azureBox,
      h(
        'div',
        { class: 'card result', 'data-testid': 'assess-result' },
        h('p', { class: 'eyebrow' }, 'Nota por som'),
        h(
          'div',
          { class: 'score-main' },
          scoreRing(r.pronunciation),
          h(
            'div',
            { class: 'score-main__text' },
            h('strong', { 'data-testid': 'overall-verdict' }, verdict(r.pronunciation)),
            h('span', null, `Sons ${r.accuracy}. Fluidez ${r.fluency}. Frase completa ${r.completeness}.`),
          ),
        ),
        focus.length > 0 && h('p', { class: 'focus-legend' }, h('span', { class: 'focus-legend__mark', 'aria-hidden': 'true' }), 'As palavras marcadas foram as mais difíceis. Toque numa para ver as sílabas.'),
        h(
          'div',
          { class: 'word-scores' },
          r.words.map((w) =>
            h(
              'button',
              { class: `word-score${needsWork(w) ? ' word-score--focus' : ''}`, type: 'button', onclick: () => showWord(w), 'data-focus': needsWork(w) ? 'true' : undefined },
              h('span', { lang: 'fr' }, w.word),
              h('small', null, w.errorType !== 'None' ? ERROR_LABELS[w.errorType] ?? String(w.accuracy) : String(w.accuracy)),
            ),
          ),
        ),
        detail,
      ),
    );
    const worst = [...r.words].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (worst) showWord(worst);
  };

  renderTarget();
  renderRecorder('idle');
  void azureStatus().then((s) => {
    azure = s;
    if (recordedBlob) renderAzurePanel();
  });
  if (fromQuery) void speak(target.text);

  return {
    title: 'Fale e compare',
    back: fromQuery ? '/frases' : '/aprender',
    tab: 'learn',
    cleanup: () => {
      left = true;
      window.clearInterval(timer);
      tracker.dispose();
      recorder.release();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      stopSpeaking();
    },
    content: h('div', { class: 'stack' }, targetBox, recorderBox, errorBox, resultBox),
  };
};

/** Anel da nota geral (0–100). */
function scoreRing(value: number): HTMLElement {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.innerHTML =
    `<circle cx="32" cy="32" r="${r}" class="ring__track"/>` +
    `<circle cx="32" cy="32" r="${r}" class="ring__value" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - value / 100)}" transform="rotate(-90 32 32)"/>`;
  return h('div', { class: 'ring ring--main', 'data-testid': 'overall-score' }, h('div', { class: 'ring__chart' }, svg, h('strong', null, String(value))), h('span', null, 'Nota geral'));
}
