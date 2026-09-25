#!/usr/bin/env node
// Gera public/seed/seed.json a partir dos arquivos em scripts/seed/.
// Valida referências cruzadas e regras de conteúdo; falha (exit 1) em
// qualquer inconsistência, para que um seed quebrado nunca chegue ao app.
//
// Uso: npm run seed

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_WORDS } from './seed/words-core.mjs';
import { CORE_WORDS_2 } from './seed/words-core-2.mjs';
import { EXTRA_WORDS } from './seed/words-extra.mjs';
import {
  COGNATE_RULES, FALSE_COGNATES, MINIMAL_PAIRS, READING_RULES, FRAMES, SCENES, USERS,
} from './seed/content.mjs';

/** Incrementar quando o conteúdo mudar: o app repopula as tabelas de conteúdo
 *  (sem tocar no progresso dos usuários) ao detectar uma versão nova. */
export const SEED_VERSION = 4;

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
const extra = parseWords(EXTRA_WORDS, 'words-extra');
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
  users: USERS,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/seed/seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed));
const hooks = words.filter((w) => w.memory_hook_pt).length;
console.log(
  `✔ seed v${SEED_VERSION}: ${words.length} palavras (800 núcleo), ${hooks} ganchos, ` +
  `${cognate_rules.length} regras de cognato, ${false_cognates.length} falsos cognatos, ` +
  `${reading_rules.length} regras de leitura, ${minimal_pairs.length} pares mínimos, ` +
  `${frames.length} frames, ${scenes.length} cenas → public/seed/seed.json`,
);
