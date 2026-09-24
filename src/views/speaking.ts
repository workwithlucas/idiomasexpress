import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { ipa, playButton } from '../ui/components';
import { speak, stopSpeaking } from '../lib/tts';
import { describeMicError, recordingSupported, VoiceRecorder } from '../lib/recorder';
import { toWav16kMono } from '../lib/wav';
import { assessPronunciation, azureStatus, PronunciationError, type PronunciationResult, type WordScore } from '../lib/pronunciation';
import { fillFrame, pickRandom, primaryPt } from '../lib/text';

interface Target {
  text: string;
  pt?: string;
  ipa?: string;
  wordId?: string;
}

const MAX_SECONDS = 15;

const ERROR_LABELS: Record<string, string> = {
  Mispronunciation: 'pronúncia',
  Omission: 'omitida',
  Insertion: 'a mais',
  UnexpectedBreak: 'pausa',
  MissingBreak: 'sem pausa',
  Monotone: 'monótona',
};

function tone(score: number): 'good' | 'ok' | 'bad' {
  return score >= 80 ? 'good' : score >= 60 ? 'ok' : 'bad';
}

function randomWord(): Target {
  const pool = content().words.filter((w) => w.freq_rank <= 300 && w.fr.length >= 3);
  const w = pickRandom(pool);
  return { text: w.fr, pt: w.pt, ipa: w.ipa, wordId: w.id };
}

function randomSentence(): Target {
  const c = content();
  const frame = pickRandom(c.frames);
  const word = c.wordById.get(pickRandom(frame.slot_pool_ids))!;
  return { text: fillFrame(frame.template, word.fr), pt: fillFrame(frame.pt, primaryPt(word)) };
}

export const speakingView: View = ({ query }) => {
  const fromQuery = query.get('texto');
  let target: Target = fromQuery ? { text: fromQuery.slice(0, 200) } : randomWord();
  const recorder = new VoiceRecorder();
  let recordingUrl: string | null = null;
  let recordedBlob: Blob | null = null;
  let timer: number | undefined;
  let azure: 'configured' | 'not_configured' | 'unreachable' | 'checking' = 'checking';

  const targetBox = h('div', { class: 'stack stack--sm' });
  const recorderBox = h('div');
  const resultBox = h('div');
  const statusBox = h('div');

  const resetRecording = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = null;
    recordedBlob = null;
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
        h('p', { class: 'eyebrow' }, '1 · Ouça o modelo'),
        h('p', { class: 'target__text', lang: 'fr', 'data-testid': 'speak-target' }, target.text),
        (target.ipa || target.pt) && h('p', { class: 'target__meta' }, target.ipa && ipa(target.ipa), target.ipa && target.pt && ' · ', target.pt),
        h(
          'div',
          { class: 'row' },
          playButton(target.text, { wordId: target.wordId, size: 'lg', label: 'Ouvir' }),
          playButton(target.text, { wordId: target.wordId, size: 'lg', rate: 0.65, label: 'Ouvir devagar' }),
          h('span', { class: 'hint' }, 'Normal e devagar'),
        ),
      ),
      h(
        'div',
        { class: 'row row--wrap' },
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => setTarget(randomWord()), 'data-testid': 'another-word' }, icon('shuffle', 16), 'Outra palavra'),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => setTarget(randomSentence()), 'data-testid': 'another-sentence' }, icon('shuffle', 16), 'Outra frase'),
      ),
    );

  const renderRecorder = (state: 'idle' | 'recording' | 'recorded' | 'busy', seconds = 0) => {
    if (!recordingSupported) {
      render(recorderBox, h('div', { class: 'callout callout--warn' }, icon('alert', 20), h('p', null, 'Este navegador não permite gravar áudio. Use Chrome, Edge, Firefox ou Safari atualizados.')));
      return;
    }
    const mainBtn =
      state === 'recording'
        ? h('button', { class: 'rec rec--on', type: 'button', onclick: stopRecording, 'aria-label': 'Parar gravação', 'data-testid': 'rec-stop' }, icon('stop', 30))
        : h('button', { class: 'rec', type: 'button', onclick: startRecording, disabled: state === 'busy', 'aria-label': 'Gravar', 'data-testid': 'rec-start' }, icon('mic', 30));

    render(
      recorderBox,
      h(
        'div',
        { class: 'card recorder' },
        h('p', { class: 'eyebrow' }, '2 · Grave sua voz'),
        h(
          'div',
          { class: 'recorder__main' },
          mainBtn,
          h(
            'p',
            { class: 'recorder__status' },
            state === 'recording' ? h('span', { class: 'rec-dot' }, `Gravando… ${seconds}s`) : state === 'recorded' ? 'Gravado. Ouça e compare com o modelo.' : state === 'busy' ? 'Processando…' : 'Toque para gravar e fale a frase.',
          ),
        ),
        recordingUrl && state !== 'recording' && h('audio', { class: 'recorder__audio', controls: true, src: recordingUrl, 'data-testid': 'own-recording' }),
        state === 'recorded' &&
          h(
            'div',
            { class: 'stack stack--sm' },
            h('p', { class: 'eyebrow' }, '3 · Avalie'),
            h(
              'button',
              { class: 'btn btn--primary btn--block', type: 'button', onclick: evaluate, disabled: azure !== 'configured', 'data-testid': 'evaluate' },
              icon('sparkles', 18),
              'Avaliar pronúncia (Azure)',
            ),
          ),
      ),
    );
  };

  const startRecording = async () => {
    resetRecording();
    stopSpeaking();
    try {
      await recorder.start();
    } catch (e) {
      render(resultBox, h('div', { class: 'callout callout--error' }, icon('alert', 20), h('p', null, describeMicError(e))));
      return;
    }
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
    try {
      recordedBlob = await recorder.stop();
      recordingUrl = URL.createObjectURL(recordedBlob);
      void logActivity(currentUser().id, 'speaking', 'record', { word_id: target.wordId });
      renderRecorder('recorded');
    } catch (e) {
      renderRecorder('idle');
      render(resultBox, h('div', { class: 'callout callout--error' }, icon('alert', 20), h('p', null, (e as Error).message)));
    }
  };

  const evaluate = async () => {
    if (!recordedBlob) return;
    renderRecorder('busy');
    render(resultBox, h('div', { class: 'card loading' }, h('span', { class: 'spinner' }), 'Enviando para o Azure…'));
    try {
      const wav = await toWav16kMono(recordedBlob);
      const result = await assessPronunciation(wav, target.text);
      void logActivity(currentUser().id, 'speaking', 'assess', { word_id: target.wordId, score: result.pronunciation });
      renderResult(result);
    } catch (e) {
      const msg = e instanceof PronunciationError ? e.message : `Não foi possível avaliar: ${(e as Error).message}`;
      render(resultBox, h('div', { class: 'callout callout--error', 'data-testid': 'assess-error' }, icon('alert', 20), h('p', null, msg)));
    }
    renderRecorder('recorded');
  };

  const renderResult = (r: PronunciationResult) => {
    const detail = h('div', { class: 'phonemes' });
    const showWord = (w: WordScore) =>
      render(
        detail,
        h('div', { class: 'phonemes__head' }, h('strong', { lang: 'fr' }, w.word), playButton(w.word, { size: 'sm' }), h('span', { class: `score-tag score-tag--${tone(w.accuracy)}` }, `${w.accuracy}`)),
        w.phonemes.length
          ? h('ul', { class: 'phonemes__list' }, w.phonemes.map((p) => h('li', { class: `phoneme phoneme--${tone(p.accuracy)}` }, h('span', { class: 'phoneme__sym' }, p.phoneme), h('span', null, String(p.accuracy)))))
          : h('p', { class: 'muted' }, 'Sem detalhe de fonemas para esta palavra.'),
      );

    render(
      resultBox,
      h(
        'div',
        { class: 'card result', 'data-testid': 'assess-result' },
        h('p', { class: 'eyebrow' }, 'Resultado'),
        h(
          'div',
          { class: 'rings' },
          ring('Pronúncia', r.pronunciation),
          ring('Precisão', r.accuracy),
          ring('Fluência', r.fluency),
          ring('Completude', r.completeness),
        ),
        r.recognizedText && h('p', { class: 'result__heard' }, 'O Azure entendeu: ', h('em', { lang: 'fr' }, `“${r.recognizedText}”`)),
        h('p', { class: 'eyebrow' }, 'Por palavra — toque para ver os fonemas'),
        h(
          'div',
          { class: 'word-scores' },
          r.words.map((w) =>
            h(
              'button',
              { class: `word-score word-score--${tone(w.accuracy)}`, type: 'button', onclick: () => showWord(w) },
              h('span', { lang: 'fr' }, w.word),
              h('small', null, w.errorType !== 'None' ? `${w.accuracy} · ${ERROR_LABELS[w.errorType] ?? w.errorType}` : String(w.accuracy)),
            ),
          ),
        ),
        detail,
        h('p', { class: 'legend' }, h('span', { class: 'dot dot--good' }), '≥ 80 ótimo ', h('span', { class: 'dot dot--ok' }), '60–79 quase ', h('span', { class: 'dot dot--bad' }), '< 60 treinar'),
      ),
    );
    const worst = [...r.words].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (worst) showWord(worst);
  };

  const renderStatus = () => {
    if (azure === 'configured' || azure === 'checking') return render(statusBox);
    render(
      statusBox,
      h(
        'div',
        { class: 'callout callout--info', 'data-testid': 'azure-status' },
        icon('info', 20),
        h(
          'p',
          null,
          azure === 'not_configured'
            ? 'A nota automática usa o Azure Speech, que ainda não foi configurado (veja o README). Você pode gravar e comparar com o modelo normalmente.'
            : 'Sem conexão com o serviço de avaliação agora. Grave e compare com o modelo; a nota volta quando houver internet.',
        ),
      ),
    );
  };

  renderTarget();
  renderRecorder('idle');
  void azureStatus().then((s) => {
    azure = s;
    renderStatus();
    renderRecorder(recordedBlob ? 'recorded' : 'idle');
  });

  if (fromQuery) void speak(target.text);

  return {
    title: 'Repetição falada',
    back: fromQuery ? '/frases' : '/aprender',
    tab: 'learn',
    cleanup: () => {
      window.clearInterval(timer);
      recorder.release();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      stopSpeaking();
    },
    content: h('div', { class: 'stack' }, statusBox, targetBox, recorderBox, resultBox),
  };
};

function ring(label: string, value: number): HTMLElement {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.innerHTML =
    `<circle cx="32" cy="32" r="${r}" class="ring__track"/>` +
    `<circle cx="32" cy="32" r="${r}" class="ring__value" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - value / 100)}" transform="rotate(-90 32 32)"/>`;
  return h('div', { class: `ring ring--${tone(value)}` }, h('div', { class: 'ring__chart' }, svg, h('strong', null, String(value))), h('span', null, label));
}
