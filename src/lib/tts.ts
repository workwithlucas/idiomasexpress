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
  const next = speechSynthesis.getVoices();
  const changed = next.length !== voices.length || next.some((v, i) => v.voiceURI !== voices[i]?.voiceURI);
  voices = next;
  if (changed || !pollingDone) listeners.forEach((fn) => fn());
}

/**
 * A lista de vozes chega de forma assíncrona e o aviso "voiceschanged" não é
 * confiável: o Safari/iOS muitas vezes nunca o dispara, e alguns WebViews de
 * Android preenchem a lista tarde. Por isso, enquanto a lista estiver vazia,
 * relemos getVoices() a cada 250 ms por até 4 s.
 */
let pollingDone = false;
let pollTimer: number | undefined;

export function ensureVoices(): void {
  if (!ttsSupported || voices.length) {
    pollingDone = true;
    return;
  }
  pollingDone = false;
  window.clearInterval(pollTimer);
  const started = Date.now();
  pollTimer = window.setInterval(() => {
    refreshVoices();
    if (voices.length || Date.now() - started > 4_000) {
      window.clearInterval(pollTimer);
      pollingDone = true;
      listeners.forEach((fn) => fn());
    }
  }, 250);
}

if (ttsSupported) {
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  ensureVoices();
}

export type VoiceStatus = 'unsupported' | 'loading' | 'none-listed' | 'no-french' | 'ok';

/** Situação das vozes deste aparelho, para a tela de Ajustes explicar. */
export function voiceStatus(): VoiceStatus {
  if (!ttsSupported) return 'unsupported';
  if (frenchVoices().length) return 'ok';
  if (voices.length) return 'no-french';
  return pollingDone ? 'none-listed' : 'loading';
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

/** Idioma BCP 47 normalizado (Android às vezes informa "fr_FR"). */
const normLang = (lang: string) => lang.replace('_', '-');

export type TtsProblem = 'unsupported' | 'no-french-voice';

/** Avisa a interface (ver main.ts) quando não há como falar em francês. */
function reportProblem(problem: TtsProblem): void {
  window.dispatchEvent(new CustomEvent<TtsProblem>('tts-problem', { detail: problem }));
}

/** Chrome carrega as vozes de forma assíncrona: espera até 1,5 s pela lista. */
function voicesReady(): Promise<void> {
  if (voices.length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t);
      off();
      resolve();
    };
    const t = setTimeout(done, 1500);
    const off = onVoicesChanged(() => voices.length && done());
  });
}

let speaking: { resolve: (ok: boolean) => void } | null = null;
let callId = 0;

/**
 * Fala o texto em francês. Resolve true ao terminar, false se interrompido/erro.
 * Cancela a fala anterior (clicar rápido em vários botões não enfileira áudio).
 *
 * Nunca cai para uma voz de outro idioma: se o aparelho lista vozes mas nenhuma
 * é francesa, não fala e avisa. Se o navegador não expõe lista nenhuma (alguns
 * WebViews), pede fr-FR pelo atributo lang, que é o melhor possível ali.
 */
export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  /** Voz específica (ex.: variação de falantes no treino de ouvido). Precisa ser francesa. */
  voice?: SpeechSynthesisVoice | null;
}

/**
 * Tempo real da fala nativa (TTS): duração total e início de cada palavra,
 * vindos dos eventos "boundary". Usado para ancorar o ritmo da melodia-alvo
 * no módulo de fala. Guardado por texto, só para a velocidade normal.
 */
export interface NativeTiming {
  duration: number;
  /** Início de cada palavra em segundos, na ordem do texto. */
  wordStarts: { charIndex: number; t: number }[];
}
const nativeTimings = new Map<string, NativeTiming>();

export function getNativeTiming(text: string): NativeTiming | undefined {
  return nativeTimings.get(text);
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<boolean> {
  if (!ttsSupported) {
    reportProblem('unsupported');
    return false;
  }
  if (speaking) {
    speaking.resolve(false);
    speaking = null;
  }
  speechSynthesis.cancel();
  const myCall = ++callId;
  // Com a lista já carregada (Safari/iOS sempre), fala na mesma pilha do toque,
  // o que o iOS exige; só espera quando a lista ainda não chegou.
  if (!voices.length) {
    await voicesReady();
    if (myCall !== callId) return false; // outro áudio foi pedido enquanto esperávamos
  }
  // Compara por nome: a lista de vozes pode ter sido recriada desde que o perfil foi montado.
  const requested = opts.voice ? (frenchVoices().find((v) => v.name === opts.voice!.name) ?? null) : null;
  const voice = requested ?? pickVoice();
  if (!voice && voices.length) {
    reportProblem('no-french-voice');
    return false;
  }
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? normLang(voice.lang) : 'fr-FR';
    u.rate = opts.rate ?? prefs().speechRate;
    if (opts.pitch) u.pitch = opts.pitch;
    // Mede o ritmo nativo (início de cada palavra) na velocidade padrão.
    const measure = !opts.rate && !opts.pitch && !opts.voice;
    let startedAt = 0;
    const wordStarts: NativeTiming['wordStarts'] = [];
    u.onstart = () => (startedAt = performance.now());
    u.onboundary = (e) => {
      if (startedAt && e.name !== 'sentence') wordStarts.push({ charIndex: e.charIndex, t: (performance.now() - startedAt) / 1000 });
    };
    // Salvaguarda: alguns ambientes nunca disparam onend.
    const timeout = setTimeout(() => finish(false), 4000 + (text.length * 180) / Math.min(1, u.rate));
    const finish = (ok: boolean) => {
      clearTimeout(timeout);
      if (speaking?.resolve === finish) speaking = null;
      resolve(ok);
    };
    speaking = { resolve: finish };
    u.onend = () => {
      if (measure && startedAt) {
        // Normaliza para a velocidade 1,0 (a velocidade padrão do app é ajustável).
        const k = u.rate || 1;
        nativeTimings.set(text, {
          duration: ((performance.now() - startedAt) / 1000) * k,
          wordStarts: wordStarts.map((w) => ({ charIndex: w.charIndex, t: w.t * k })),
        });
      }
      finish(true);
    };
    u.onerror = () => finish(false);
    speechSynthesis.speak(u);
    // Alguns navegadores (Chrome/Android) ficam "pausados" após inatividade.
    if (speechSynthesis.paused) speechSynthesis.resume();
  });
}

export function stopSpeaking(): void {
  if (!ttsSupported) return;
  callId++; // cancela também uma fala que ainda esperava a lista de vozes
  speaking?.resolve(false);
  speaking = null;
  speechSynthesis.cancel();
}

/** Fala uma sequência com pausa entre os itens (ex.: par mínimo). */
export async function speakSequence(texts: string[], gapMs = 700, opts: SpeakOptions = {}): Promise<boolean> {
  for (let i = 0; i < texts.length; i++) {
    const ok = await speak(texts[i], opts);
    if (!ok) return false;
    if (i < texts.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return true;
}

// ---- Vários falantes (treino de ouvido) -----------------------------------

export interface SpeakerProfile {
  /** Rótulo neutro para a interface ("voz 1", "voz 2"…). */
  id: number;
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
}

const FEMALE = /(am[ée]lie|audrey|aur[ée]lie|marie|c[ée]line|denise|julie|hortense|virginie|l[ée]a|chantal|claire|sylvie|eloise|[ée]lo[ïi]se|vivienne|brigitte|coralie|jacqueline|yvette|google fran[çc]ais|female|femme|x-frc|x-frd)/i;
const MALE = /(thomas|nicolas|henri|paul|daniel|mathieu|jacques|guillaume|antoine|r[ée]mi|yannick|j[ée]r[ôo]me|alain|claude|fabrice|gr[ée]goire|jean|male|homme|x-frb)/i;

export function guessGender(v: SpeechSynthesisVoice): 'f' | 'm' | '?' {
  if (FEMALE.test(v.name) || FEMALE.test(v.voiceURI)) return 'f';
  if (MALE.test(v.name) || MALE.test(v.voiceURI)) return 'm';
  return '?';
}

/**
 * Falantes para o treino de alta variabilidade: o ouvido aprende o contraste
 * quando o mesmo som vem de vozes diferentes.
 * - 2+ vozes francesas: usa até 4 diferentes, priorizando uma feminina e uma masculina.
 * - 1 ou nenhuma: varia sutilmente altura e velocidade da mesma voz (plano B).
 */
export function speakerPool(): SpeakerProfile[] {
  const fr = frenchVoices();
  const unique = [...new Map(fr.map((v) => [v.name, v])).values()];
  if (unique.length >= 2) {
    const f = unique.filter((v) => guessGender(v) === 'f');
    const m = unique.filter((v) => guessGender(v) === 'm');
    const rest = unique.filter((v) => !f.includes(v) && !m.includes(v));
    const ordered = [f[0], m[0], ...f.slice(1), ...m.slice(1), ...rest].filter(Boolean) as SpeechSynthesisVoice[];
    return ordered.slice(0, 4).map((voice, i) => ({ id: i + 1, voice, pitch: 1, rate: 0.9 }));
  }
  const base = unique[0] ?? null;
  return [
    { id: 1, voice: base, pitch: 1, rate: 0.9 },
    { id: 2, voice: base, pitch: 0.8, rate: 0.85 },
    { id: 3, voice: base, pitch: 1.2, rate: 0.95 },
  ];
}
