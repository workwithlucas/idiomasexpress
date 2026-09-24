import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { playButton } from '../ui/components';
import { getNativeTiming, speak, stopSpeaking } from '../lib/tts';
import { describeMicError, recordingSupported, recordingUnavailableReason, VoiceRecorder } from '../lib/recorder';
import { decodeMono16k, toWav16kMono, WAV_RATE } from '../lib/wav';
import { assessPronunciation, azureStatus, PronunciationError, type AzureStatus, type PronunciationResult, type WordScore } from '../lib/pronunciation';
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

function tone(score: number): 'good' | 'ok' | 'bad' {
  return score >= 80 ? 'good' : score >= 60 ? 'ok' : 'bad';
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
  let timer: number | undefined;
  let azure: AzureStatus | 'checking' = 'checking';
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
        h('button', { class: 'chip-btn', type: 'button', onclick: () => setTarget(randomSentence()), 'data-testid': 'another-sentence' }, icon('shuffle', 14), 'Outra frase'),
        h('button', { class: 'chip-btn', type: 'button', onclick: () => setTarget(randomWord()), 'data-testid': 'another-word' }, icon('shuffle', 14), 'Uma palavra'),
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
                  : 'Agora você: toque e fale.',
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
      // Melodia e nota são independentes: a melodia é local e sai sempre.
      void showProsody(recordedBlob, frames, myAttempt);
    } catch (e) {
      renderRecorder('idle');
      render(errorBox, h('div', { class: 'callout callout--error' }, icon('alert', 20), h('p', null, (e as Error).message)));
    }
  };

  const renderResultShell = () => {
    render(resultBox, prosodyBox, azureBox);
    render(prosodyBox, h('div', { class: 'card loading' }, h('span', { class: 'spinner' }), 'Desenhando sua melodia…'));
    renderAzurePanel();
  };

  const showProsody = async (blob: Blob, liveFrames: ReturnType<PitchTracker['stop']>, myAttempt: number) => {
    let user: UserContour | null = userContour(liveFrames);
    if (!user) {
      // Plano B: analisa o arquivo gravado (mesmo algoritmo, sem depender do tempo real).
      try {
        user = userContour(analyzeSamples(await decodeMono16k(blob), WAV_RATE));
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

  const renderAzurePanel = () => {
    if (azure === 'configured') {
      render(
        azureBox,
        h('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: evaluate, 'data-testid': 'evaluate' }, icon('sparkles', 18), 'Ver nota da pronúncia'),
      );
    } else if (azure !== 'checking') {
      render(
        azureBox,
        h(
          'p',
          { class: 'soft-note', 'data-testid': 'azure-status' },
          icon('info', 16),
          azure === 'not_configured'
            ? 'A nota por som ainda não foi ligada neste app (veja o README). A melodia acima funciona sem ela.'
            : azure === 'offline'
              ? 'Sem internet: a nota por som volta quando conectar. A melodia acima funciona offline.'
              : 'A nota por som está fora do ar agora. A melodia acima continua valendo.',
        ),
      );
    }
  };

  const evaluate = async () => {
    if (!recordedBlob) return;
    const myAttempt = attempt;
    render(azureBox, h('div', { class: 'card loading' }, h('span', { class: 'spinner' }), 'Calculando a nota…'));
    try {
      const wav = await toWav16kMono(recordedBlob);
      const result = await assessPronunciation(wav, target.text);
      if (myAttempt !== attempt) return;
      void logActivity(currentUser().id, 'speaking', 'assess', { word_id: target.wordId, score: result.pronunciation });
      renderScore(result);
    } catch (e) {
      if (myAttempt !== attempt) return;
      console.warn('Nota de pronúncia indisponível:', e);
      // Mensagem curta e sem jargão; o detalhe técnico fica no console.
      const code = e instanceof PronunciationError ? e.code : 'upstream';
      const msg =
        code === 'offline' || code === 'network'
          ? 'Sem conexão para a nota agora. A melodia acima continua valendo.'
          : code === 'no_speech'
            ? 'Não deu pra ouvir a frase inteira. Tente de novo, mais perto do microfone.'
            : 'Não deu pra calcular a nota agora. A melodia acima continua valendo.';
      render(azureBox, h('p', { class: 'soft-note', 'data-testid': 'assess-error' }, icon('info', 16), msg));
    }
  };

  const renderScore = (r: PronunciationResult) => {
    const detail = h('div', { class: 'phonemes' });
    const showWord = (w: WordScore) =>
      render(
        detail,
        h('div', { class: 'phonemes__head' }, h('strong', { lang: 'fr' }, w.word), playButton(w.word, { size: 'sm' }), h('span', { class: `score-tag score-tag--${tone(w.accuracy)}` }, `${w.accuracy}`)),
        w.phonemes.length ? h('ul', { class: 'phonemes__list' }, w.phonemes.map((p) => h('li', { class: `phoneme phoneme--${tone(p.accuracy)}` }, h('span', { class: 'phoneme__sym' }, p.phoneme), h('span', null, String(p.accuracy))))) : null,
      );
    render(
      azureBox,
      h(
        'div',
        { class: 'card result', 'data-testid': 'assess-result' },
        h('p', { class: 'eyebrow' }, 'Nota por som'),
        h('div', { class: 'rings' }, scoreRing('Geral', r.pronunciation), scoreRing('Sons', r.accuracy), scoreRing('Fluidez', r.fluency), scoreRing('Completa', r.completeness)),
        h(
          'div',
          { class: 'word-scores' },
          r.words.map((w) =>
            h(
              'button',
              { class: `word-score word-score--${tone(w.accuracy)}`, type: 'button', onclick: () => showWord(w) },
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

function scoreRing(label: string, value: number): HTMLElement {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.innerHTML =
    `<circle cx="32" cy="32" r="${r}" class="ring__track"/>` +
    `<circle cx="32" cy="32" r="${r}" class="ring__value" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - value / 100)}" transform="rotate(-90 32 32)"/>`;
  return h('div', { class: `ring ring--${tone(value)}` }, h('div', { class: 'ring__chart' }, svg, h('strong', null, String(value))), h('span', null, label));
}
