// Gera docs/conteudo.md a partir do seed: os Momentos (título, can_do, chave)
// e todas as pontes com o tipo, e a justificativa das de origem.
// Uso: npm run seed && node scripts/dev/report.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { ORIGIN_NOTES } from '../seed/bridges.mjs';

const seed = JSON.parse(readFileSync(new URL('../../public/seed/seed.json', import.meta.url), 'utf8'));
const KIND = { leitura: 'leitura', som: 'som', ponte: 'ponte', gramatica: 'gramática' };
const out = [];
out.push('# Conteúdo v5: Momentos e pontes', '', `Gerado de \`public/seed/seed.json\` (hash ${seed.hash}).`, '');
out.push(`## Os ${seed.momentos.length} Momentos`, '');
for (const ch of seed.chapters) {
  out.push(`### ${ch.order}. ${ch.title}`, '', '| # | Momento | Agora você consegue… | Chave | Tipo | Como funciona |', '|---|---|---|---|---|---|');
  for (const m of seed.momentos.filter((x) => x.chapter_id === ch.id)) {
    out.push(`| ${m.order} | ${m.title} | ${m.can_do} | ${m.key.name} | ${KIND[m.key.kind]} | cap. ${m.key.chapter} |`);
  }
  out.push('');
}
const bridges = seed.words.filter((w) => w.bridge);
const count = (k) => bridges.filter((w) => w.bridge.kind === k).length;
out.push('## Pontes', '', `${bridges.length} pontes: ${count('igual')} iguais, ${count('parecida')} parecidas, ${count('regra')} por regra de cognato, ${count('origem')} de origem.`, '');
for (const kind of ['igual', 'parecida', 'origem', 'regra']) {
  const list = bridges.filter((w) => w.bridge.kind === kind).sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));
  out.push(`### ${kind} (${list.length})`, '');
  if (kind === 'origem') {
    out.push('| Francês | Português | Nota no app | Justificativa |', '|---|---|---|---|');
    for (const w of list) out.push(`| ${w.fr} | ${w.bridge.pt} | ${w.bridge.note} | ${ORIGIN_NOTES[w.fr] ?? ''} |`);
  } else if (kind === 'regra') {
    out.push('| Francês | Português | Regra |', '|---|---|---|');
    for (const w of list) out.push(`| ${w.fr} | ${w.bridge.pt} | ${w.bridge.note.split(':')[0]} |`);
  } else {
    out.push('| Francês | Português | Nota no app |', '|---|---|---|');
    for (const w of list) out.push(`| ${w.fr} | ${w.bridge.pt} | ${w.bridge.note} |`);
  }
  out.push('');
}
writeFileSync(new URL('../../docs/conteudo.md', import.meta.url), out.join('\n'));
console.log(`docs/conteudo.md: ${seed.momentos.length} momentos, ${bridges.length} pontes`);
