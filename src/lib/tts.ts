import { prefs } from './prefs';

/**
 * Síntese de voz em francês com a Web Speech API (nativa, funciona offline
 * quando o sistema tem uma voz francesa local instalada).
 */

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function refreshVoices() {
  if (!ttsSupported) return;
  voices = speechSynthesis.getVoices();
  listeners.forEach((fn) => fn());
}

if (ttsSupported) {
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

export function onVoicesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function frenchVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('fr'));
}

/** Preferência: escolha do usuário → fr-FR local de boa qualidade → qualquer fr. */
export function pickVoice(): SpeechSynthesisVoice | null {
  const fr = frenchVoices();
  const chosen = prefs().voiceURI && fr.find((v) => v.voiceURI === prefs().voiceURI);
  if (chosen) return chosen;
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().replace('_', '-') === 'fr-fr' ? 4 : 0) +
    (v.localService ? 2 : 0) +
    (/(google|amélie|amelie|thomas|audrey|marie|denise|premium|enhanced|natural)/i.test(v.name) ? 1 : 0);
  return fr.sort((a, b) => score(b) - score(a))[0] ?? null;
}

let speaking: { resolve: (ok: boolean) => void } | null = null;

/**
 * Fala o texto em francês. Resolve true ao terminar, false se interrompido/erro.
 * Cancela a fala anterior (clicar rápido em vários botões não enfileira áudio).
 */
export function speak(text: string, opts: { rate?: number } = {}): Promise<boolean> {
  if (!ttsSupported) return Promise.resolve(false);
  if (speaking) {
    speaking.resolve(false);
    speaking = null;
  }
  speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'fr-FR';
    u.rate = opts.rate ?? prefs().speechRate;
    // Salvaguarda: alguns ambientes nunca disparam onend (ex.: sem voz instalada).
    const timeout = setTimeout(() => finish(false), 4000 + text.length * 180);
    const finish = (ok: boolean) => {
      clearTimeout(timeout);
      if (speaking?.resolve === finish) speaking = null;
      resolve(ok);
    };
    speaking = { resolve: finish };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    speechSynthesis.speak(u);
    // Alguns navegadores (Chrome/Android) ficam "pausados" após inatividade.
    if (speechSynthesis.paused) speechSynthesis.resume();
  });
}

export function stopSpeaking(): void {
  if (!ttsSupported) return;
  speaking?.resolve(false);
  speaking = null;
  speechSynthesis.cancel();
}

/** Fala uma sequência com pausa entre os itens (ex.: par mínimo). */
export async function speakSequence(texts: string[], gapMs = 700): Promise<boolean> {
  for (let i = 0; i < texts.length; i++) {
    const ok = await speak(texts[i]);
    if (!ok) return false;
    if (i < texts.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return true;
}
