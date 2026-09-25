#!/usr/bin/env node
// Gera public/seed/seed.json a partir dos arquivos em scripts/seed/.
// Valida referências cruzadas e regras de conteúdo; falha (exit 1) em
// qualquer inconsistência, para que um seed quebrado nunca chegue ao app.
//
// Uso: npm run seed

import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_WORDS } from './seed/words-core.mjs';
import { CORE_WORDS_2 } from './seed/words-core-2.mjs';
import { EXTRA_WORDS } from './seed/words-extra.mjs';
import { MOMENTO_WORDS } from './seed/words-momentos.mjs';
import { BRIDGES, ORIGIN_NOTES } from './seed/bridges.mjs';
import { CHAPTERS, MOMENTOS } from './seed/momentos.mjs';
import {
  COGNATE_RULES, FALSE_COGNATES, MINIMAL_PAIRS, READING_RULES, FRAMES, SCENES, USERS,
} from './seed/content.mjs';

/** Incrementar quando o conteúdo mudar: o app repopula as tabelas de conteúdo
 *  (sem tocar no progresso dos usuários) ao detectar uma versão nova. */
export const SEED_VERSION = 5;

const THEMES = new Set([
  'essenciais', 'verbos', 'cotidiano', 'tempo', 'pessoas', 'lugares', 'numeros', 'casa',
  'trabalho', 'creche', 'banco', 'saude', 'compras', 'transporte', 'administracao',
  'descricao', 'sentimentos',
]);
const GENDERS = new Set(['', 'm', 'f', 'mpl', 'fpl']);

const errors = [];
const fail = (msg) => errors.push(msg);

function slug(fr) {
  return fr
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseWords(block, source) {
  return block.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length !== 7) fail(`${source}:${i + 1} esperava 7 colunas, achou ${cols.length}: ${line}`);
    const [fr, pt, ipa, theme, gender, rule, hook] = cols;
    return { fr, pt, ipa, theme: theme || 'essenciais', gender, rule, hook, source };
  });
}

const core1 = parseWords(CORE_WORDS, 'words-core');
const core2 = parseWords(CORE_WORDS_2, 'words-core-2');
const core = [...core1, ...core2];
const extra = [...parseWords(EXTRA_WORDS, 'words-extra'), ...parseWords(MOMENTO_WORDS, 'words-momentos')];
if (core1.length !== 300) fail(`words-core deve ter exatamente 300 palavras (tem ${core1.length})`);
if (core2.length !== 500) fail(`words-core-2 deve ter exatamente 500 palavras, ranks 301–800 (tem ${core2.length})`);

const ruleIds = new Set(COGNATE_RULES.map((r) => r.id));
const usedIds = new Set();
const byFr = new Map();
const words = [];

[...core, ...extra].forEach((w, idx) => {
  if (byFr.has(w.fr)) fail(`palavra duplicada: "${w.fr}"`);
  if (!w.pt) fail(`"${w.fr}" sem tradução`);
  if (!w.ipa) fail(`"${w.fr}" sem IPA`);
  if (!THEMES.has(w.theme)) fail(`"${w.fr}" tema desconhecido: ${w.theme}`);
  if (!GENDERS.has(w.gender)) fail(`"${w.fr}" gênero inválido: ${w.gender}`);
  if (w.rule && !ruleIds.has(w.rule)) fail(`"${w.fr}" regra de cognato inexistente: ${w.rule}`);
  if (w.rule && w.hook) fail(`"${w.fr}" tem regra de cognato E gancho de memória (gancho é só para não cognatas)`);

  // Ids estáveis e legíveis; homógrafos sem acento (là/la, où/ou) ganham sufixo.
  let id = `w_${slug(w.fr)}`;
  for (let n = 2; usedIds.has(id); n++) id = `w_${slug(w.fr)}_${n}`;
  usedIds.add(id);

  const word = {
    id,
    fr: w.fr,
    pt: w.pt,
    ipa: w.ipa,
    freq_rank: idx + 1,
    theme: w.theme,
    audio_generated: false,
  };
  if (w.gender) word.gender = w.gender;
  if (w.rule) word.cognate_rule_id = w.rule;
  if (w.hook) word.memory_hook_pt = w.hook;
  words.push(word);
  byFr.set(w.fr, word);
});

function ref(fr, ctx) {
  const w = byFr.get(fr);
  if (!w) {
    fail(`${ctx}: palavra "${fr}" não existe no banco`);
    return 'MISSING';
  }
  return w.id;
}

const cognate_rules = COGNATE_RULES.map((r) => {
  const examples = words.filter((w) => w.cognate_rule_id === r.id).map((w) => w.id);
  // 3 para descobrir a regra + pelo menos 2 para aplicar sozinho.
  if (examples.length < 5) fail(`regra ${r.id} tem só ${examples.length} exemplos (mínimo 5)`);
  return { id: r.id, pattern: r.pattern, explanation: r.explanation, examples };
});
if (cognate_rules.length < 15) fail('são necessárias pelo menos 15 regras de cognatos');

const false_cognates = FALSE_COGNATES.map((f) => {
  const word_id = ref(f.word, 'falso cognato');
  if (byFr.get(f.word)?.cognate_rule_id) fail(`falso cognato "${f.word}" não pode ter regra de cognato`);
  return { id: `fc_${slug(f.word)}`, word_id, looks_like: f.looks_like, warning_pt: f.warning };
});

const minimal_pairs = MINIMAL_PAIRS.map((p) => ({
  id: `mp_${slug(p.a)}_${slug(p.b)}`,
  word_a_id: ref(p.a, 'par mínimo'),
  word_b_id: ref(p.b, 'par mínimo'),
  feature: p.feature,
}));
if (minimal_pairs.length < 10) fail('são necessários pelo menos 10 pares mínimos');

const reading_rules = READING_RULES.map((r) => {
  // 3 para descobrir + pelo menos 2 para aplicar sozinho.
  if (r.examples.length < 5 || r.examples.length > 6) fail(`regra de leitura ${r.id}: use 5 ou 6 exemplos`);
  return {
    id: r.id,
    grapheme: r.grapheme,
    sound: r.sound,
    tip_pt: r.tip_pt,
    examples: r.examples.map((e) => (typeof e === 'string' ? { word_id: ref(e, `regra de leitura ${r.id}`) } : { fr: e.fr, ipa: e.ipa, pt: e.pt })),
  };
});

const frameIds = new Set();
const frames = FRAMES.map((f) => {
  if (!f.template.includes('___') || !f.pt.includes('___')) fail(`frame ${f.id} precisa de "___" no template e no pt`);
  if (frameIds.has(f.id)) fail(`frame duplicado ${f.id}`);
  frameIds.add(f.id);
  const frame = { id: f.id, template: f.template, pt: f.pt, slot_pool_ids: f.slot.map((s) => ref(s, `frame ${f.id}`)) };
  if (f.note_pt) frame.note_pt = f.note_pt;
  return frame;
});

const scenes = SCENES.map((s) => {
  const word_ids = [...new Set(s.words)].map((fr) => ref(fr, `cena ${s.id}`));
  s.frames.forEach((id) => { if (!frameIds.has(id)) fail(`cena ${s.id}: frame ${id} não existe`); });
  if (s.id.startsWith('sc_lu_')) {
    if (word_ids.length < 15) fail(`cena ${s.id}: mínimo 15 palavras (tem ${word_ids.length})`);
    // Molde próprio = usado só por esta cena.
    const own = s.frames.filter((id) => SCENES.filter((o) => o.frames.includes(id)).length === 1);
    if (own.length < 5) fail(`cena ${s.id}: mínimo 5 moldes próprios (tem ${own.length})`);
  }
  return { id: s.id, name: s.name, icon: s.icon, description: s.description, word_ids, frame_ids: s.frames };
});


// ---- Pontes ------------------------------------------------------------------
const BRIDGE_KINDS = new Set(['igual', 'parecida', 'regra', 'origem']);
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return dp[a.length][b.length];
}
const plain = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
for (const [fr, b] of Object.entries(BRIDGES)) {
  const w = byFr.get(fr);
  if (!w) { fail(`ponte: palavra "${fr}" não existe no banco`); continue; }
  const [kind, pt, note] = b;
  if (!BRIDGE_KINDS.has(kind)) fail(`ponte "${fr}": tipo inválido ${kind}`);
  if (!pt || !note) fail(`ponte "${fr}": falta português ou nota`);
  if (kind === 'origem' && !ORIGIN_NOTES[fr]) fail(`ponte de origem "${fr}" sem justificativa em ORIGIN_NOTES`);
  w.bridge = { kind, pt, note };
}
for (const fr of Object.keys(ORIGIN_NOTES)) if (BRIDGES[fr]?.[0] !== 'origem') fail(`ORIGIN_NOTES "${fr}" não é ponte de origem`);
// Regra de cognato sem ponte escrita: a ponte é a própria regra (verificada).
const ruleById = new Map(COGNATE_RULES.map((r) => [r.id, r]));
for (const w of words) {
  if (w.bridge || !w.cognate_rule_id) continue;
  const options = w.pt.split(/[;,]/).map((o) => o.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
  const pt = options.reduce((best, o) => (editDistance(plain(o), plain(w.fr)) < editDistance(plain(best), plain(w.fr)) ? o : best), options[0]);
  const rule = ruleById.get(w.cognate_rule_id);
  w.bridge = { kind: 'regra', pt, note: `${rule.pattern}: ${rule.explanation}` };
}
const hasBridge = (id) => !!words.find((w) => w.id === id)?.bridge;

// ---- Capítulos e Momentos ----------------------------------------------------
const sceneIds = new Set(SCENES.map((s) => s.id));
const chapters = CHAPTERS.map((c, i) => {
  if (!sceneIds.has(c.scene)) fail(`capítulo ${c.id}: cena ${c.scene} não existe`);
  return { id: c.id, order: i + 1, title: c.title, scene_id: c.scene };
});
const chapterIds = new Set(chapters.map((c) => c.id));
const PER_CHAPTER = { ch1: 5 };
/** Espaço fino (U+202F) antes de ! ? : ; — tipografia francesa. */
const frTypo = (t) => t.replace(/[   ]*([!?;:])/g, ' $1');
/** Palavras soltas fora dos colchetes que não são do banco (nomes próprios). */
const PROPER = new Set(['Luxembourg', 'Lucas', 'Eduarda', 'Kirchberg', 'Esch', 'Belval', 'Hamilius', 'Brésil', 'Sophie', 'Marc', 'Léa', 'Tom']);
const lineKey = (t) => t.toLowerCase().replace(/[\s  .,!?;:]+/g, ' ').trim();

function parseLine(raw, ctx) {
  const text = frTypo(raw);
  const tokens = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m;
  const pushText = (t) => {
    if (!t) return;
    for (const word of t.match(/\p{L}[\p{L}'’-]*/gu) ?? []) if (!PROPER.has(word)) fail(`${ctx}: "${word}" fora dos colchetes`);
    tokens.push({ t });
  };
  while ((m = re.exec(text))) {
    pushText(text.slice(last, m.index));
    const [surface, lemma, gloss] = m[1].split('|');
    const cands = lemma ? [lemma] : [surface, surface.charAt(0).toLowerCase() + surface.slice(1), surface.toLowerCase()];
    const w = cands.map((c) => byFr.get(c)).find(Boolean);
    if (!w) fail(`${ctx}: palavra "${lemma ?? surface}" não existe no banco`);
    const tok = { t: surface, w: w?.id ?? 'MISSING' };
    if (gloss) tok.gloss = gloss;
    tokens.push(tok);
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return tokens;
}

const seenWords = new Set();
const seenKeys = new Map();
const momentoFrames = [];
const momentos = MOMENTOS.map((mo, i) => {
  const ctx = `momento ${mo.id}`;
  if (!chapterIds.has(mo.chapter)) fail(`${ctx}: capítulo ${mo.chapter} não existe`);
  for (const f of ['title', 'can_do', 'intro']) if (!mo[f]) fail(`${ctx}: falta ${f}`);
  if (/[!]/.test(mo.title + mo.can_do + mo.intro)) fail(`${ctx}: exclamação fora de frase em francês`);
  if (mo.lines.length < 4 || mo.lines.length > 6) fail(`${ctx}: o diálogo precisa de 4 a 6 falas`);
  const speakers = new Set(mo.lines.map((l) => l[0]));
  if (speakers.size !== 2 || !speakers.has('Você')) fail(`${ctx}: o diálogo é entre uma pessoa e "Você"`);
  const lines = mo.lines.map(([speaker, fr, pt], j) => {
    const tokens = parseLine(fr, `${ctx} fala ${j + 1}`);
    const word_ids = [...new Set(tokens.filter((t) => t.w).map((t) => t.w))];
    return { speaker, fr: tokens.map((t) => t.t).join(''), pt, word_ids, tokens };
  });
  const distinct = [...new Set(lines.flatMap((l) => l.word_ids))];
  const dialogueText = lines.map((l) => l.fr).join(' ').toLowerCase();

  // Reaproveitamento: a partir do 2º Momento, ≥ 40% já apareceu antes e no
  // máximo 6 palavras realmente novas (nunca vistas e sem ponte).
  const reused = distinct.filter((id) => seenWords.has(id));
  const reallyNew = distinct.filter((id) => !seenWords.has(id) && !hasBridge(id));
  if (i > 0 && reused.length / distinct.length < 0.4) fail(`${ctx}: só ${reused.length} de ${distinct.length} palavras já apareceram antes (mínimo 40%)`);
  if (reallyNew.length > 6) fail(`${ctx}: ${reallyNew.length} palavras realmente novas (máximo 6): ${reallyNew.join(', ')}`);
  distinct.forEach((id) => seenWords.add(id));

  // Chave
  const k = mo.key;
  if (!['leitura', 'ponte', 'som', 'gramatica'].includes(k.kind)) fail(`${ctx}: tipo de chave inválido ${k.kind}`);
  if (seenKeys.has(k.ref)) fail(`${ctx}: a chave ${k.ref} já foi usada em ${seenKeys.get(k.ref)}`);
  seenKeys.set(k.ref, mo.id);
  if (!(k.chapter >= 1 && k.chapter <= 13)) fail(`${ctx}: capítulo do Como funciona inválido`);
  if (k.examples.length !== 3) fail(`${ctx}: a chave usa 3 exemplos`);
  const examples = k.examples.map((e) => {
    const src = typeof e === 'string' ? e : e.fr;
    const parts = src.split(/[[\]]/);
    const fr = parts.join('');
    if (!dialogueText.includes(fr.toLowerCase())) fail(`${ctx}: exemplo "${fr}" não está no diálogo`);
    const ex = { fr, parts };
    if (typeof e !== 'string' && e.pt) ex.pt = e.pt;
    return ex;
  });
  if (!k.reveal.startsWith('Isso.')) fail(`${ctx}: a confirmação começa com "Isso."`);
  if (!k.hint.startsWith('Quase.') || !k.apply_hint.startsWith('Quase.')) fail(`${ctx}: a pista começa com "Quase."`);
  if (!(k.correct >= 0 && k.correct < k.options.length)) fail(`${ctx}: resposta certa fora das opções`);
  if (k.apply.length !== 2) fail(`${ctx}: a chave tem 2 palavras para aplicar`);
  k.apply.forEach((a) => {
    if (!(a.correct >= 0 && a.correct < a.options.length) || !a.fr || !a.pt) fail(`${ctx}: aplicação inválida (${a.fr})`);
  });
  const key = {
    kind: k.kind, ref_id: k.ref, name: k.name, chapter: k.chapter, intro: k.intro, examples,
    question: k.question, options: k.options, correct: k.correct, hint: k.hint, reveal: k.reveal,
    apply_question: k.apply_question, apply_hint: k.apply_hint, apply: k.apply,
  };
  if (k.extra) key.extra = k.extra;

  // Molde do passo 4: tirado do diálogo, 4 a 5 opções.
  const f = mo.frame;
  const frame_id = `f_${mo.id}`;
  if (f.slot.length < 4 || f.slot.length > 5) fail(`${ctx}: o molde tem de 4 a 5 opções`);
  const template = frTypo(f.template);
  const slot_pool_ids = f.slot.map((fr) => ref(fr, `${ctx} molde`));
  const lineKeys = lines.map((l) => lineKey(l.fr));
  const fromDialogue = f.slot.some((fr) => lineKeys.some((lk) => lk.includes(lineKey(template.replace('___', fr)))));
  if (!fromDialogue) fail(`${ctx}: o molde "${f.template}" não sai de nenhuma fala do diálogo`);
  momentoFrames.push({ id: frame_id, template, pt: f.pt, slot_pool_ids });

  let minimal_pair_id, pair_target_id, pair_question;
  if (mo.pair) {
    const [a, b] = mo.pair.split('/');
    minimal_pair_id = `mp_${slug(a)}_${slug(b)}`;
    if (!MINIMAL_PAIRS.some((p) => p.a === a && p.b === b)) fail(`${ctx}: par mínimo ${mo.pair} não existe`);
    const target = [a, b].find((fr) => distinct.includes(byFr.get(fr)?.id));
    if (!target) fail(`${ctx}: nenhuma palavra do par ${mo.pair} está no diálogo`);
    pair_target_id = byFr.get(target ?? a)?.id;
    pair_question = `${mo.pronoun ?? 'Ela'} disse ${a} ou ${b}?`;
  }

  const out = {
    id: mo.id, chapter_id: mo.chapter, order: i + 1, title: mo.title, can_do: mo.can_do, intro_pt: mo.intro,
    minutes: mo.minutes ?? 6, lines, key, frame_id,
    build_title: f.title ?? 'Monte a sua frase',
    build_intro: f.intro ?? 'Troque a palavra quantas vezes quiser. Cada frase toca sozinha.',
  };
  if (minimal_pair_id) Object.assign(out, { minimal_pair_id, pair_target_id, pair_question });
  return out;
});
for (const c of chapters) {
  const n = momentos.filter((m) => m.chapter_id === c.id).length;
  if (n > (PER_CHAPTER[c.id] ?? 4)) fail(`capítulo ${c.id}: ${n} momentos (máximo ${PER_CHAPTER[c.id] ?? 4})`);
}
// Os momentos seguem a ordem dos capítulos.
momentos.forEach((m, i) => {
  if (i && chapters.find((c) => c.id === m.chapter_id).order < chapters.find((c) => c.id === momentos[i - 1].chapter_id).order) fail(`momento ${m.id} fora da ordem dos capítulos`);
});
frames.push(...momentoFrames);

if (errors.length) {
  console.error(`\n✖ Seed inválido (${errors.length} erro(s)):`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

const seed = {
  version: SEED_VERSION,
  words,
  cognate_rules,
  false_cognates,
  reading_rules,
  minimal_pairs,
  frames,
  scenes,
  chapters,
  momentos,
  users: USERS,
};
seed.hash = createHash('sha256').update(JSON.stringify(seed)).digest('hex').slice(0, 12);

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/seed/seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed));
const hooks = words.filter((w) => w.memory_hook_pt).length;
console.log(
  `✔ seed v${SEED_VERSION}: ${words.length} palavras (800 núcleo), ${hooks} ganchos, ` +
  `${cognate_rules.length} regras de cognato, ${false_cognates.length} falsos cognatos, ` +
  `${reading_rules.length} regras de leitura, ${minimal_pairs.length} pares mínimos, ` +
  `${frames.length} frames, ${scenes.length} cenas, ${chapters.length} capítulos, ${momentos.length} momentos, ` +
  `${words.filter((w) => w.bridge).length} pontes → public/seed/seed.json`,
);
