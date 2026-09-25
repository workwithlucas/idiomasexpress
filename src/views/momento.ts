import { h, render, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import {
  completeMomento, completedMomentos, content, getReviewState, markPhraseSeen, rateWord, todaysReencontros, buildReencontros,
  type Reencontro,
} from '../db/repo';
import type { Momento, Word } from '../db/schema';
import { currentUser } from '../ui/user';
import { playButton, iconButton, openWordSheet } from '../ui/components';
import { lineText, lineView, YOU } from '../ui/dialogue';
import { speak, speakerPool, stopSpeaking, type SpeakOptions } from '../lib/tts';
import { buildPhrase, momentoStats, phraseFromBuilt, type Phrase } from '../lib/momento';
import { frenchSentence } from '../exercises/common';
import { speakPanel } from '../ui/speakPanel';
import { openSheet } from '../ui/sheet';
import { guideChapterContent } from './guide';
import { setJustCompleted, skipReencontrosToday, skippedReencontrosToday } from '../ui/flags';
import { directionFor } from '../lib/reencontro';
import { cue } from '../lib/sounds';
import { prefs } from '../lib/prefs';
import { cap } from '../lib/text';

/** Um passo do Momento: o conteúdo e se o botão principal já pode seguir. */
interface Step {
  el: HTMLElement;
  canNext: () => boolean;
  cleanup?: () => void;
}

const STEP_COUNT = 6;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Duas vozes francesas diferentes: a pessoa da cena e "Você". */
function dialogueVoices(): { other: SpeakOptions; you: SpeakOptions } {
  const pool = speakerPool();
  const opt = (p: (typeof pool)[number]): SpeakOptions => ({ voice: p.voice, pitch: p.pitch, rate: p.rate });
  return { other: opt(pool[0]), you: opt(pool[1] ?? pool[0]) };
}

/**
 * O Momento: tela cheia, sem abas, com X para sair e uma barra fina de 6
 * segmentos. Se houver reencontros hoje, eles vêm antes (até 8) e emendam no
 * Momento. Com `?so=reencontros` (Caderno → Revisar mais), só os reencontros.
 */
export const momentoView: View = async ({ params, query }) => {
  const c = content();
  const user = currentUser();
  const onlyReview = params.id === undefined;
  const m = onlyReview ? undefined : c.momentoById.get(params.id);
  if (!onlyReview && !m) throw new Error('Momento não encontrado.');

  // Só reencontros: os de hoje (quando não há próximo Momento) ou "Revisar mais" do Caderno.
  const todayOnly = onlyReview && query.get('hoje') === '1';
  const backTo = todayOnly ? '/' : '/caderno';
  let queue: Reencontro[] = [];
  if (todayOnly) queue = await todaysReencontros(user.id, skippedReencontrosToday());
  else if (onlyReview) queue = await buildReencontros(user.id, 10, { phrases: false, skip: Number(query.get('skip') ?? 0) });
  else if (query.get('r') === '1') queue = await todaysReencontros(user.id, skippedReencontrosToday());
  const firstEver = (await completedMomentos(user.id)).size === 0;

  const voices = dialogueVoices();
  const voiceFor = (speaker: string) => (speaker === YOU ? voices.you : voices.other);
  let stepCleanup: (() => void) | undefined;
  let current: Step | null = null;
  let stepIndex = -1;

  const seg = h('div', { class: 'seg', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(STEP_COUNT) });
  const body = h('div', { class: 'mo-body' });
  const foot = h('div', { class: 'mo-foot' });
  const exit = () => {
    stopSpeaking();
    navigate(onlyReview ? backTo : '/');
  };
  const shell = h(
    'div',
    { class: 'mo', dataset: { momento: m?.id ?? 'reencontros' } },
    h(
      'div',
      { class: 'mo-head' },
      h('button', { class: 'xbtn', type: 'button', 'aria-label': onlyReview ? (todayOnly ? 'Sair e voltar para Hoje' : 'Sair e voltar ao Caderno') : 'Sair do momento', onclick: exit, 'data-testid': 'momento-close' }, icon('x', 22)),
      seg,
    ),
    body,
    foot,
  );

  const show = (step: Step, segState: { on: number; label: string; single?: number }) => {
    stepCleanup?.();
    stopSpeaking();
    current = step;
    stepCleanup = step.cleanup;
    if (segState.single !== undefined) {
      seg.className = 'seg seg--single';
      render(seg, h('i', { style: `width:${segState.single}%` }));
      seg.setAttribute('aria-valuemax', '100');
      seg.setAttribute('aria-valuenow', String(Math.round(segState.single)));
    } else {
      seg.className = 'seg';
      render(seg, Array.from({ length: STEP_COUNT }, (_, i) => h('i', { class: i < segState.on ? 'on' : '' })));
      seg.setAttribute('aria-valuemax', String(STEP_COUNT));
      seg.setAttribute('aria-valuenow', String(segState.on));
    }
    seg.setAttribute('aria-label', segState.label);
    render(body, h('div', { class: 'mo-in' }, h('div', { class: 'stage' }, step.el)));
    body.scrollTop = 0;
  };

  /** Rodapé com um único botão principal. */
  const primaryFoot = (label: string, onclick: () => void, testid = 'momento-next') => {
    const btn = h('button', { class: 'btn', type: 'button', onclick: () => btn.disabled || onclick(), 'data-testid': testid }, label);
    render(foot, btn);
    return btn;
  };
  const refreshFoot = () => {
    const btn = foot.querySelector<HTMLButtonElement>('[data-testid=momento-next]');
    if (btn && current) btn.disabled = !current.canNext();
  };

  // ---- Reencontros -----------------------------------------------------------
  let rIndex = 0;
  const nextReencontro = () => {
    if (rIndex >= queue.length) {
      if (onlyReview) navigate(backTo);
      else goStep(0);
      return;
    }
    const item = queue[rIndex];
    const label = `Reencontro ${rIndex + 1} de ${queue.length}`;
    const step = reencontroStep(item, user.id, () => {
      rIndex++;
      nextReencontro();
    }, foot, voices.you);
    show(step, { on: 0, label, single: (rIndex / queue.length) * 100 });
    if (!onlyReview || todayOnly) {
      step.el.append(
        h('button', {
          class: 'link', type: 'button', 'data-testid': 'skip-reencontros',
          onclick: () => {
            skipReencontrosToday();
            if (m) goStep(0);
            else navigate('/');
          },
        }, 'Pular reencontros hoje'),
      );
    }
  };

  // ---- Os 6 passos -----------------------------------------------------------
  let built: Word | null = null;
  let completedSaved = false;

  const goStep = (i: number) => {
    stepIndex = i;
    const mo = m!;
    const labels = ['Escute', 'Você já sabe', 'A chave', 'Monte', 'Fale', 'Leve com você'];
    const step =
      i === 0 ? listenStep(mo, voiceFor)
      : i === 1 ? knowStep(mo, voiceFor, refreshFoot)
      : i === 2 ? keyStep(mo, refreshFoot)
      : i === 3 ? buildStep(mo, voices.you, built, (w) => { built = w; refreshFoot(); })
      : i === 4 ? speakStep(phraseOf(mo), () => goStep(5))
      : takeStep(mo, phraseOf(mo), firstEver, voices.you);
    show(step, { on: i + 1, label: `Passo ${i + 1} de ${STEP_COUNT}: ${labels[i]}` });
    if (i === 5) {
      primaryFoot('Terminar', () => {
        setJustCompleted(mo.id);
        navigate('/');
      });
      if (!completedSaved) {
        completedSaved = true;
        const p = phraseOf(mo);
        void completeMomento(user.id, mo.id, p.fr, p.wordId);
      }
    } else {
      primaryFoot('Continuar', () => goStep(i + 1));
      refreshFoot();
    }
  };

  const phraseOf = (mo: Momento): Phrase => {
    const frame = c.frameById.get(mo.frame_id)!;
    const w = built ?? c.wordById.get(frame.slot_pool_ids[0])!;
    return buildPhrase(frame, w);
  };

  // ?passo=N abre direto num passo (links diretos e testes).
  const startAt = Number(query.get('passo'));
  if (m && startAt >= 1 && startAt <= STEP_COUNT) goStep(startAt - 1);
  else if (queue.length) nextReencontro();
  else if (m) goStep(0);
  else render(body, h('div', { class: 'mo-in' }, h('p', { class: 'soft' }, 'Nada para revisar agora.')));

  return {
    title: m?.title ?? (todayOnly ? 'Reencontros' : 'Revisar mais'),
    full: true,
    content: shell,
    cleanup: () => {
      stepCleanup?.();
      stopSpeaking();
      void stepIndex;
    },
  };
};

// ---------------------------------------------------------------------------
// Passo 1 · Escute
// ---------------------------------------------------------------------------
function listenStep(m: Momento, voiceFor: (s: string) => SpeakOptions): Step {
  let showPt = false;
  let playing = 0;
  const pts: HTMLElement[] = [];
  const toggle = h('button', { class: 'link', type: 'button', 'data-testid': 'toggle-pt', 'aria-expanded': 'false' }, 'Mostrar tradução');
  toggle.addEventListener('click', () => {
    showPt = !showPt;
    pts.forEach((p) => (p.hidden = !showPt));
    toggle.textContent = showPt ? 'Esconder tradução' : 'Mostrar tradução';
    toggle.setAttribute('aria-expanded', String(showPt));
  });
  const playAll = iconButton('play', 'Ouvir a conversa', async () => {
    if (playing) {
      playing = 0;
      stopSpeaking();
      return;
    }
    const me = (playing = Date.now());
    for (const l of m.lines) {
      if (playing !== me) return;
      const ok = await speak(lineText(l), voiceFor(l.speaker));
      if (!ok || playing !== me) return;
      await wait(220);
    }
    playing = 0;
  }, 'play-all');

  const lines = m.lines.map((l) => {
    const pt = h('p', { class: 'pt', hidden: true }, l.pt);
    pts.push(pt);
    return h(
      'div',
      { class: 'line' },
      h('div', { class: 'lt' }, h('p', { class: `who${l.speaker === YOU ? ' who--you' : ''}` }, l.speaker), lineView(l), pt),
      playButton(lineText(l), { label: `Ouvir a fala de ${l.speaker === YOU ? 'você' : l.speaker.toLowerCase()}`, voice: voiceFor(l.speaker) }),
    );
  });

  const el = h(
    'div',
    { 'data-testid': 'step-listen' },
    h('h2', { class: 'h2' }, 'Escute a cena'),
    h('p', { class: 'soft' }, m.intro_pt),
    h('div', { class: 'row gap' }, playAll, toggle),
    h('div', { class: 'lines' }, lines),
    h('p', { class: 'fine' }, 'Não precisa entender tudo. Só escute.'),
    pairQuestion(m, voiceFor(YOU)),
  );
  return { el, canNext: () => true, cleanup: () => { playing = 0; } };
}

/** "Ela disse X ou Y?": a palavra do diálogo, tocada com a outra voz. */
function pairQuestion(m: Momento, voice: SpeakOptions): Child {
  const c = content();
  const pair = m.minimal_pair_id ? c.pairById.get(m.minimal_pair_id) : undefined;
  if (!pair || !m.pair_question || !m.pair_target_id) return null;
  const a = c.wordById.get(pair.word_a_id)!;
  const b = c.wordById.get(pair.word_b_id)!;
  const target = c.wordById.get(m.pair_target_id)!;
  const result = h('p', { class: 'soft', 'aria-live': 'polite' });
  let done = false;
  const opts = [a, b].map((w) => {
    const btn = h('button', { class: 'opt', type: 'button', lang: 'fr', dataset: { word: w.id } }, w.fr);
    btn.addEventListener('click', () => {
      if (done) return;
      const right = w.id === target.id;
      btn.classList.add(right ? 'opt--right' : 'opt--tried');
      cue(right ? 'right' : 'almost');
      if (right) {
        done = true;
        opts.forEach((o) => (o.disabled = true));
        result.textContent = `Isso. Era ${target.fr}, ${target.pt.split(/[;,]/)[0]}.`;
      } else {
        result.textContent = `Quase. Ouve de novo e repara na vogal.`;
        void speak(target.fr, voice);
      }
    });
    return btn;
  });
  return h(
    'div',
    { class: 'card pairq', 'data-testid': 'pair-question' },
    h('div', { class: 'row between' }, h('p', { class: 'q m0' }, m.pair_question), playButton(target.fr, { label: 'Ouvir a palavra', voice })),
    h('div', { class: 'opts opts--two' }, opts),
    result,
  );
}

// ---------------------------------------------------------------------------
// Passo 2 · Você já sabe
// ---------------------------------------------------------------------------
function knowStep(m: Momento, voiceFor: (s: string) => SpeakOptions, changed: () => void): Step {
  const c = content();
  const stats = momentoStats(m, c.wordById);
  let revealed = false;
  const top = h('div');
  const onWord = (tok: { t: string; w?: string; gloss?: string }) => {
    const w = c.wordById.get(tok.w!);
    if (w) openWordSheet(w, { surface: tok.t, gloss: tok.gloss, voice: voiceFor('') });
  };
  const dialog = h('div', { class: 'dialog', 'data-testid': 'dialog' }, m.lines.map((l) => lineView(l, { onWord, knownIds: stats.knownIds })));

  const reveal = () => {
    revealed = true;
    cue('tap');
    render(
      top,
      h(
        'div',
        { class: 'card', 'data-testid': 'reveal-count', 'aria-live': 'polite' },
        h('p', { class: 'count' }, `${stats.known} de ${stats.total}`),
        h('p', { class: 'm0' }, 'palavras desta conversa já moram no seu português.'),
        h('p', { class: 'fine' }, 'Toque em qualquer palavra.'),
      ),
    );
    // Acende as palavras com ponte em sequência (sem movimento: só a cor de fundo).
    let n = 0;
    dialog.querySelectorAll<HTMLElement>('.tok').forEach((t) => {
      if (t.dataset.known === '1') t.style.transitionDelay = `${n++ * 70}ms`;
      else t.classList.add('tok--new');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.querySelectorAll('.tok[data-known="1"]').forEach((t) => t.classList.add('tok--known'))));
    changed();
  };
  render(
    top,
    h('p', { class: 'soft' }, 'Antes de estudar qualquer coisa, veja quanto desse francês você já conhece.'),
    h('button', { class: 'btn2', type: 'button', onclick: reveal, 'data-testid': 'reveal-known' }, 'Mostrar o que eu já sei'),
  );
  return {
    el: h('div', { 'data-testid': 'step-know' }, h('h2', { class: 'h2' }, 'Você já sabe mais do que imagina'), top, dialog),
    canNext: () => revealed,
  };
}

// ---------------------------------------------------------------------------
// Passo 3 · A chave
// ---------------------------------------------------------------------------
function keyStep(m: Momento, changed: () => void): Step {
  const k = m.key;
  let ok = false;
  const tried = new Set<number>();
  const after = h('div');
  const hint = h('p', { class: 'soft', 'aria-live': 'polite' });
  const options = k.options.map((o, i) => {
    const b = h('button', { class: 'opt', type: 'button', dataset: { i: String(i), right: String(i === k.correct) } }, o);
    b.addEventListener('click', () => {
      if (ok) return;
      tried.add(i);
      if (i === k.correct) {
        ok = true;
        cue('right');
        b.classList.add('opt--right');
        options.forEach((x) => (x.disabled = true));
        hint.textContent = '';
        showAfter();
        changed();
      } else {
        cue('almost');
        b.classList.add('opt--tried');
        hint.textContent = k.hint;
      }
    });
    return b;
  });

  const showAfter = () => {
    const applied = k.apply.map(() => false);
    const extra = h('div');
    const cards = k.apply.map((a, i) => {
      const status = h('p', { class: 'soft m0', 'aria-live': 'polite' });
      const audio = h('span');
      const opts = a.options.map((o, j) => {
        const b = h('button', { class: 'opt', type: 'button', dataset: { right: String(j === a.correct) } }, o);
        b.addEventListener('click', () => {
          if (applied[i]) return;
          if (j === a.correct) {
            applied[i] = true;
            cue('right');
            b.classList.add('opt--right');
            opts.forEach((x) => (x.disabled = true));
            status.textContent = `Isso. ${a.fr} quer dizer ${a.pt}.`;
            render(audio, playButton(a.fr, { label: `Ouvir ${a.fr}` }));
            void speak(a.fr); // primeiro prevê, depois ouve
            if (applied.every(Boolean) && k.extra) render(extra, h('div', { class: 'note' }, h('p', null, k.extra)));
          } else {
            cue('almost');
            b.classList.add('opt--tried');
            status.textContent = k.apply_hint;
          }
        });
        return b;
      });
      return h(
        'div',
        { class: 'card ap', 'data-testid': 'apply' },
        h('div', { class: 'row between' }, h('span', { class: 'w', lang: 'fr' }, a.fr), audio),
        h('p', { class: 'soft m0' }, k.apply_question),
        h('div', { class: 'opts opts--two' }, opts),
        status,
      );
    });
    render(
      after,
      h('div', { class: 'note', 'data-testid': 'key-reveal' }, h('p', null, k.reveal)),
      h('button', { class: 'link', type: 'button', 'data-testid': 'key-more', onclick: () => openSheet(guideChapterContent(k.chapter, { inSheet: true }), { label: 'Entender melhor', testid: 'guide-sheet' }) }, 'Entender melhor'),
      h('h3', { class: 'h3' }, 'Agora tente você'),
      cards,
      extra,
    );
  };

  const el = h(
    'div',
    { 'data-testid': 'step-key' },
    h('h2', { class: 'h2' }, 'A chave de hoje'),
    h('p', { class: 'soft' }, k.intro),
    k.examples.map((e) =>
      h(
        'div',
        { class: 'kw' },
        h('span', { class: 'w', lang: 'fr' }, e.parts.map((p, i) => (i % 2 ? h('em', null, p) : p))),
        playButton(e.fr, { label: `Ouvir ${e.fr}` }),
      ),
    ),
    h('p', { class: 'q' }, k.question),
    h('div', { class: 'opts' }, options),
    hint,
    after,
  );
  return { el, canNext: () => ok };
}

// ---------------------------------------------------------------------------
// Passo 4 · Monte
// ---------------------------------------------------------------------------
function buildStep(m: Momento, voice: SpeakOptions, chosen: Word | null, onPick: (w: Word) => void): Step {
  const c = content();
  const frame = c.frameById.get(m.frame_id)!;
  const pool = frame.slot_pool_ids.map((id) => c.wordById.get(id)!).filter(Boolean);
  const [before, after] = frame.template.split('___');
  const slot = h('span', { class: 'slot' });
  const pt = h('p', { class: 'soft m0 mt2', 'aria-live': 'polite', 'data-testid': 'built-pt' });
  const fine = h('p', { class: 'fine' });
  let current = chosen;
  const chips = pool.map((w) => {
    const b = h('button', { class: 'chip', type: 'button', lang: 'fr', 'aria-pressed': 'false', dataset: { word: w.id } }, w.fr);
    b.addEventListener('click', () => pick(w, true));
    return b;
  });
  const sentence = h('p', { class: 'big m0', lang: 'fr', 'data-testid': 'built-sentence' }, cap(before), slot, after);
  const pick = (w: Word, play: boolean) => {
    current = w;
    const p = buildPhrase(frame, w);
    slot.textContent = w.fr;
    // Primeira letra maiúscula se o molde começa pela lacuna.
    if (!before.trim()) slot.textContent = cap(w.fr);
    pt.textContent = p.pt;
    chips.forEach((b) => {
      const on = b.dataset.word === w.id;
      b.classList.toggle('chip--on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    fine.textContent = 'Repara: você acabou de montar uma frase em francês sem decorar nada.';
    onPick(w);
    if (play) void speak(p.fr, voice);
  };
  slot.textContent = ' '.repeat(8);
  pt.textContent = 'Escolha abaixo.';
  if (current) pick(current, false);
  const el = h(
    'div',
    { 'data-testid': 'step-build' },
    h('h2', { class: 'h2' }, m.build_title),
    h('p', { class: 'soft' }, m.build_intro),
    h('div', { class: 'card' }, sentence, pt),
    h('div', { class: 'chips' }, chips),
    fine,
  );
  return { el, canNext: () => !!current };
}

// ---------------------------------------------------------------------------
// Passo 5 · Fale
// ---------------------------------------------------------------------------
function speakStep(p: Phrase, skip: () => void): Step {
  // A frase inteira é o alvo: o histórico guarda a nota de cada palavra dela.
  const panel = speakPanel({ text: p.fr });
  const el = h(
    'div',
    { 'data-testid': 'step-speak' },
    h('h2', { class: 'h2' }, 'Agora é a sua voz'),
    h('p', { class: 'soft' }, 'Ouça, depois repita em voz alta, no seu ritmo.'),
    h('div', { class: 'card' }, frenchSentence(p.fr, 'big m0'), h('p', { class: 'soft m0 mt2' }, p.pt)),
    panel.el,
    h('button', { class: 'link', type: 'button', onclick: skip, 'data-testid': 'skip-speak' }, 'Agora não dá para falar alto'),
  );
  return { el, canNext: () => true, cleanup: panel.cleanup };
}

// ---------------------------------------------------------------------------
// Passo 6 · Leve com você
// ---------------------------------------------------------------------------
function takeStep(m: Momento, p: Phrase, firstEver: boolean, voice: SpeakOptions): Step {
  const stats = momentoStats(m, content().wordById);
  const keys = m.key ? 1 : 0;
  const el = h(
    'div',
    { 'data-testid': 'step-take' },
    h('p', { class: 'lbl mt6' }, 'Momento concluído'),
    h('h2', { class: 'h2 mt1', 'data-testid': 'can-do' }, `Agora você consegue ${m.can_do}.`),
    firstEver && h('p', { class: 'soft', 'data-testid': 'first-ever' }, 'Você acabou de entender uma conversa inteira em francês.'),
    h(
      'div',
      { class: 'card' },
      h('p', { class: 'lbl' }, 'Sua frase de hoje'),
      h('div', { class: 'row between' }, h('p', { class: 'big m0', lang: 'fr', 'data-testid': 'today-phrase' }, p.fr), playButton(p.fr, { label: 'Ouvir sua frase', voice })),
      h('p', { class: 'soft m0 mt1' }, p.pt),
    ),
    h('p', { class: 'soft' }, 'Sua frase de hoje foi para o Caderno. Amanhã ela volta para um reencontro rápido.'),
    h(
      'div',
      { class: 'stats', 'data-testid': 'stats' },
      h('div', null, h('b', null, String(stats.total)), h('span', null, 'palavras encontradas')),
      h('div', null, h('b', null, String(stats.known)), h('span', null, 'já eram suas')),
      h('div', null, h('b', null, String(keys)), h('span', null, keys === 1 ? 'chave nova' : 'chaves novas')),
    ),
  );
  return { el, canNext: () => true };
}

// ---------------------------------------------------------------------------
// Reencontro: uma palavra (reconhecer ou produzir, pela paridade de reps) ou
// a frase de um Momento anterior.
// ---------------------------------------------------------------------------
function reencontroStep(item: Reencontro, userId: string, done: () => void, foot: HTMLElement, voice: SpeakOptions): Step {
  const c = content();
  const el = h('div', { 'data-testid': 'reencontro' });
  const answer = h('div', { hidden: true });
  let revealed = false;

  const footWith = (...children: Child[]) => render(foot, h('div', { class: 'foot-row' }, children));
  const reveal = () => {
    revealed = true;
    cue('tap');
    answer.hidden = false;
    onReveal();
  };
  let onReveal = () => {};

  if (item.type === 'phrase') {
    const m = c.momentoById.get(item.momentoId)!;
    el.dataset.kind = 'phrase';
    void (async () => {
      const progress = (await completedMomentos(userId)).get(m.id);
      const p = phraseFromBuilt(c.frameById.get(m.frame_id), progress?.built_phrase ?? '', c.wordById);
      render(
        el,
        h('p', { class: 'lbl' }, `Sua frase do momento “${m.title}”`),
        h('p', { class: 'big', 'data-testid': 'reencontro-front' }, p.pt || 'Como era a sua frase?'),
        h('p', { class: 'soft' }, 'Como era em francês? Diga em voz alta antes de ver.'),
        answer,
      );
      render(answer, h('div', { class: 'card' }, h('div', { class: 'row between' }, frenchSentence(p.fr, 'big m0'), playButton(p.fr, { label: 'Ouvir sua frase', voice }))));
      onReveal = () => {
        void speak(p.fr, voice);
        footWith(h('button', { class: 'btn', type: 'button', 'data-testid': 'reencontro-done', onclick: async () => { await markPhraseSeen(userId, m.id); done(); } }, 'Continuar'));
      };
      footWith(h('button', { class: 'btn', type: 'button', 'data-testid': 'reencontro-show', onclick: () => revealed || reveal() }, 'Mostrar'));
    })();
    render(foot);
    return { el, canNext: () => revealed };
  }

  const word = c.wordById.get(item.wordId)!;
  el.dataset.word = word.id;
  void getReviewState(userId, word.id).then((state) => {
    const dir = directionFor(state);
    el.dataset.direction = dir;
    const fr = h('div', { class: 'row between' }, h('p', { class: 'big m0', lang: 'fr' }, word.fr), playButton(word.fr, { wordId: word.id, label: `Ouvir ${word.fr}` }));
    const pt = h('p', { class: 'pt-l' }, word.pt);
    const aid = word.bridge ? h('p', { class: 'fine' }, word.bridge.note) : word.memory_hook_pt ? h('p', { class: 'fine' }, word.memory_hook_pt) : null;
    if (dir === 'recognize') {
      render(el, h('p', { class: 'lbl', 'data-testid': 'reencontro-direction' }, 'O que quer dizer?'), h('div', { class: 'card', 'data-testid': 'reencontro-front' }, fr), answer);
      render(answer, pt, aid);
      if (prefs().autoplay) void speak(word.fr);
    } else {
      render(el, h('p', { class: 'lbl', 'data-testid': 'reencontro-direction' }, 'Como se diz em francês?'), h('div', { class: 'card', 'data-testid': 'reencontro-front' }, h('p', { class: 'big m0' }, word.pt)), answer);
      render(answer, h('div', { class: 'card' }, fr), aid);
      onReveal = () => void speak(word.fr);
    }
    const prevReveal = onReveal;
    onReveal = () => {
      prevReveal();
      const rate = (result: 'again' | 'good') => async () => {
        await rateWord(userId, word.id, result);
        done();
      };
      footWith(
        h('button', { class: 'btn2', type: 'button', 'data-testid': 'reencontro-again', onclick: rate('again') }, 'Ainda não'),
        h('button', { class: 'btn', type: 'button', 'data-testid': 'reencontro-good', onclick: rate('good') }, 'Lembrei'),
      );
    };
    footWith(h('button', { class: 'btn', type: 'button', 'data-testid': 'reencontro-show', onclick: () => revealed || reveal() }, 'Mostrar'));
  });
  render(foot);
  return { el, canNext: () => revealed };
}

