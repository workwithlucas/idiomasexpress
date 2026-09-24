import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import { describeMicError, recordingSupported, VoiceRecorder } from '../lib/recorder';
import { PitchTracker } from '../lib/pitchTracker';
import { analyzeSamples } from '../lib/pitch';
import { decodeMono16k, WAV_RATE } from '../lib/wav';
import { compareProsody, targetContour, userContour, type UserContour } from '../lib/prosody';
import { getNativeTiming, stopSpeaking } from '../lib/tts';
import { prosodyChart } from '../ui/prosodyChart';
import { logActivity } from '../db/repo';
import { cue } from '../lib/sounds';

const MAX_SECONDS = 10;

/**
 * "Fale você": grava a pessoa repetindo a frase e mostra, na hora, a melodia
 * e o ritmo dela ao lado dos do francês. Tudo local (funciona offline) e
 * independente da nota do Azure.
 */
export function echoPanel(sentence: string, userId: string, onRecorded?: () => void): { el: HTMLElement; cleanup: () => void } {
  const recorder = new VoiceRecorder();
  const tracker = new PitchTracker();
  const el = h('div', { class: 'echo', 'data-testid': 'echo' });
  let timer: number | undefined;
  let busy = false;
  let disposed = false;

  const idle = (label = 'Fale você') => {
    if (!recordingSupported) {
      render(el);
      return;
    }
    render(
      el,
      h('button', { class: 'echo__btn', type: 'button', 'data-testid': 'echo-start', onclick: start }, h('span', { class: 'echo__mic' }, icon('mic', 22)), h('span', null, label)),
    );
  };

  const start = async () => {
    if (busy) return;
    busy = true;
    stopSpeaking();
    tracker.prepare(); // dentro do toque (iOS)
    render(el, h('p', { class: 'hint hint--center' }, 'Liberando o microfone…'));
    try {
      await recorder.start();
    } catch (e) {
      busy = false;
      idle('Tentar de novo');
      el.prepend(h('p', { class: 'soft-note', 'data-testid': 'echo-error' }, icon('info', 16), describeMicError(e)));
      return;
    }
    if (disposed) {
      recorder.release();
      return;
    }
    if (recorder.mediaStream) {
      try {
        tracker.start(recorder.mediaStream);
      } catch {
        /* sem análise ao vivo: usa o arquivo depois */
      }
    }
    cue('tap');
    let s = 0;
    const status = h('span', { class: 'rec-dot' }, 'Gravando…');
    render(
      el,
      h('button', { class: 'echo__btn echo__btn--on', type: 'button', 'data-testid': 'echo-stop', onclick: stop }, h('span', { class: 'echo__mic' }, icon('stop', 22)), status),
    );
    timer = window.setInterval(() => {
      s++;
      if (s >= MAX_SECONDS) void stop();
    }, 1000);
  };

  const stop = async () => {
    window.clearInterval(timer);
    const frames = tracker.stop();
    let blob: Blob | null = null;
    try {
      blob = await recorder.stop();
    } catch {
      /* nada gravado */
    }
    busy = false;
    render(el, h('p', { class: 'hint hint--center' }, 'Comparando…'));
    let user: UserContour | null = userContour(frames);
    if (!user && blob) {
      try {
        user = userContour(analyzeSamples(await decodeMono16k(blob), WAV_RATE));
      } catch {
        /* sem análise */
      }
    }
    if (disposed) return;
    void logActivity(userId, 'speaking', 'echo');
    if (!user) {
      idle('Tentar de novo');
      el.prepend(h('p', { class: 'soft-note', 'data-testid': 'prosody-empty' }, icon('info', 16), 'Não deu pra ouvir sua voz direito. Tente mais perto do microfone.'));
      onRecorded?.();
      return;
    }
    const target = targetContour(sentence, getNativeTiming(sentence));
    const fb = compareProsody(target, user);
    render(
      el,
      h(
        'div',
        { class: 'card prosody step-in', 'data-testid': 'prosody' },
        h('p', { class: 'eyebrow' }, 'Sua melodia'),
        prosodyChart(target, user),
        h('ul', { class: 'prosody__tips', 'data-testid': 'prosody-tips' }, fb.lines.map((l, i) => h('li', { class: (i === 0 ? fb.melodyOk : fb.rhythmOk) ? 'tip tip--ok' : 'tip' }, l))),
        h('button', { class: 'chip-btn', type: 'button', onclick: start }, icon('mic', 14), 'De novo'),
      ),
    );
    onRecorded?.();
  };

  idle();
  return {
    el,
    cleanup: () => {
      disposed = true;
      window.clearInterval(timer);
      tracker.dispose();
      recorder.release();
    },
  };
}
