// Consulta rápida ao banco de palavras: node scripts/dev/lookup.mjs palavra1 "palavra 2" …
// Mostra se existe, a tradução, a ponte (ou regra) e o gancho.
import { readFileSync } from 'node:fs';
const seed = JSON.parse(readFileSync(new URL('../../public/seed/seed.json', import.meta.url), 'utf8'));
for (const q of process.argv.slice(2)) {
  const w = seed.words.find((x) => x.fr === q) ?? seed.words.find((x) => x.fr.toLowerCase() === q.toLowerCase());
  if (!w) { console.log(`✖ ${q}`); continue; }
  const b = w.bridge ? `${w.bridge.kind}: ${w.bridge.note}` : w.cognate_rule_id ?? '';
  console.log(`✔ ${w.fr} (${w.id}) = ${w.pt} | ${b} | ${w.memory_hook_pt ?? ''}`);
}
