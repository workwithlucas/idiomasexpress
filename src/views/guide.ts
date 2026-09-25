import { h, render, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { completedMomentos, content } from '../db/repo';
import { currentUser } from '../ui/user';
import { playButton } from '../ui/components';
import { frenchSentence, type Exercise } from '../exercises/common';
import { cognateLesson, cognatePt } from '../exercises/cognate';
import { readingLesson, resolveExample } from '../exercises/reading';
import { nextSpeaker, pairRound } from '../exercises/pair';
import { momentoStats } from '../lib/momento';
import { buildPhrase } from '../lib/momento';
import { frenchNumber } from '../lib/numbers';
import { shuffle } from '../lib/text';
import { speak, stopSpeaking } from '../lib/tts';
import { cue } from '../lib/sounds';
import type { Momento } from '../db/schema';

/**
 * Como funciona: o francês explicado a partir do português, em 13 capítulos
 * curtos, sempre abertos. Cada capítulo tem exemplos com áudio e, quando faz
 * sentido, uma prática curta com os motores de descoberta do app.
 */
const NB = ' '; // espaço fino antes de ? ! : ;

interface GuideChapter {
  n: number;
  title: string;
  desc: string;
}

export const GUIDE: GuideChapter[] = [
  { n: 1, title: 'Por que tanta palavra já é sua', desc: 'As pontes entre o português e o francês.' },
  { n: 2, title: 'Letras que ficam caladas', desc: 'Por que o fim da palavra some.' },
  { n: 3, title: 'Como se lê', desc: 'ai, ou, oi, eau e outras duplas de letras.' },
  { n: 4, title: 'Os sons que o português não tem', desc: 'u, eu e as vogais nasais.' },
  { n: 5, title: 'Quando a letra calada acorda', desc: 'A ligação entre as palavras.' },
  { n: 6, title: 'Tu ou vous', desc: 'Quando ser próximo, quando ser formal.' },
  { n: 7, title: 'Le, la, un, une', desc: 'Masculino e feminino sem drama.' },
  { n: 8, title: 'Être e avoir', desc: 'Ser, estar e ter: os verbos da vida.' },
  { n: 9, title: 'Dizer não', desc: 'Ne... pas, o não em duas partes.' },
  { n: 10, title: 'Perguntar sem complicar', desc: 'Três jeitos, do mais fácil ao mais formal.' },
  { n: 11, title: 'O futuro que você já usa', desc: 'Vou + verbo, igualzinho ao português.' },
  { n: 12, title: 'Falar do passado', desc: 'O passado do dia a dia.' },
  { n: 13, title: 'Os números', desc: 'Do um ao cem, incluindo o famoso soixante-dix.' },
];

// ---- Peças de texto ----------------------------------------------------------

/** Linha de regra: título, exemplo em português → francês e áudio. */
function rule(title: string, detail: Child, audio?: string): HTMLElement {
  return h('div', { class: 'rule' }, h('div', { class: 'grow' }, h('p', { class: 'r1' }, title), h('p', { class: 'r2' }, detail)), audio && playButton(audio, { label: `Ouvir ${audio}` }));
}

/** Exemplo em francês (com ligações marcadas) e a tradução. */
function example(fr: string, pt: string): HTMLElement {
  return h('div', { class: 'rule' }, h('div', { class: 'grow' }, frenchSentence(fr, 'r1'), h('p', { class: 'r2' }, pt)), playButton(fr, { label: `Ouvir ${fr}` }));
}

const panel = (...rows: Child[]) => h('div', { class: 'panel' }, rows);
const p = (...t: Child[]) => h('p', null, t);
const note = (...t: Child[]) => h('div', { class: 'note' }, h('p', { class: 'm0' }, t));
const b = (t: string) => h('b', { lang: 'fr' }, t);

// ---- Capítulos ---------------------------------------------------------------

function chapter1(inSheet: boolean): Child[] {
  const c = content();
  const first = c.momentos[0];
  const stats = first ? momentoStats(first, c.wordById) : null;
  const rows = c.cognateRules.map((r) => {
    const ex = c.wordById.get(r.examples[0]);
    return rule(r.pattern.replace(' → ', ' vira '), ex ? [`${cognatePt(ex)}, `, b(ex.fr)] : r.explanation, ex?.fr);
  });
  return [
    p('Português e francês são irmãos. Os dois nasceram do latim, e muita palavra mudou pouco no caminho.'),
    p('Algumas pontes funcionam quase sempre:'),
    panel(inSheet ? rows.slice(0, 8) : rows),
    stats && note(`No seu primeiro momento, ${stats.known} das ${stats.total} palavras da conversa já eram suas. Não foi sorte, foi parentesco.`),
    !inSheet && h('h3', { class: 'h3' }, 'Parecidas, mas com outro sentido'),
    !inSheet && p('Poucas, mas vale conhecer. Elas parecem português e querem dizer outra coisa:'),
    !inSheet && panel(c.falseCognates.map((f) => {
      const w = c.wordById.get(f.word_id)!;
      return rule(`${w.fr} não é ${f.looks_like}`, f.warning_pt, w.fr);
    })),
    !inSheet && practice('Descobrir uma ponte', (done) => {
      const pool = shuffle(c.cognateRules);
      return cognateLesson(pool[0], currentUser().id, done);
    }),
  ];
}

function chapter2(): Child[] {
  const A: [string, string][] = [['vous', 'soa vu'], ['lait', 'soa lé'], ['petit', 'soa petí'], ['chocolat', 'soa chocolá']];
  const B: [string, string][] = [['avec', 'soa avék'], ['bonjour', 'termina com r'], ['neuf', 'nove, o f aparece'], ['avril', 'abril, o l aparece']];
  return [
    p('No francês, a consoante do fim da palavra costuma ficar calada. É a chave que mais ajuda a ler em voz alta.'),
    panel(A.map(([w, d]) => rule(w, d, w))),
    p('O e do fim também costuma sumir: table soa tabl.'),
    p('Quatro letras gostam de aparecer no fim: c, r, f e l. Pense na palavra inglesa careful.'),
    panel(B.map(([w, d]) => rule(w, d, w))),
    note('Quando a palavra seguinte começa com vogal, a letra calada às vezes acorda: vous avez soa vuzavé. Isso tem nome, liaison, e você vai ver aos poucos.'),
  ];
}

/** Regras de leitura de cada capítulo (as demais ficam no 3). */
const SOUND_RULES = ['rr_u', 'rr_eu', 'rr_an', 'rr_on', 'rr_in', 'rr_un', 'rr_ien'];
const OTHER_CHAPTER_RULES = new Set([...SOUND_RULES, 'rr_final_cons', 'rr_careful', 'rr_liaison', 'rr_e_final']);

function readingRow(id: string): HTMLElement | null {
  const r = content().readingRules.find((x) => x.id === id);
  if (!r) return null;
  const ex = resolveExample(r.examples[0]);
  return rule(`${r.grapheme} soa ${r.sound}`, [`${r.tip_pt} `, b(ex.fr), `, ${ex.pt}.`], ex.fr);
}

function chapter3(inSheet: boolean): Child[] {
  const rules = content().readingRules.filter((r) => !OTHER_CHAPTER_RULES.has(r.id));
  return [
    p('Em francês, cada dupla de letras tem quase sempre o mesmo som. Conhecendo poucas, você lê em voz alta quase qualquer palavra, mesmo sem saber o que ela quer dizer.'),
    p('As que mais aparecem primeiro:'),
    panel((inSheet ? rules.slice(0, 8) : rules).map((r) => readingRow(r.id))),
    note('Não precisa decorar a lista. Cada uma aparece num momento, com palavras da conversa, e volta sozinha depois.'),
    !inSheet && practice('Descobrir um som', (done) => readingLesson(shuffle(rules)[0], currentUser().id, done)),
  ];
}

function chapter4(inSheet: boolean): Child[] {
  const c = content();
  return [
    p('Quase todo som do francês existe no português. Faltam poucos, e eles são os que mais mudam o sentido de uma palavra.'),
    h('h3', { class: 'h3' }, 'O u com biquinho'),
    p('Diga i e, sem mexer a língua, faça bico com os lábios. Esse é o u francês. O nosso u escreve-se ou.'),
    panel(readingRow('rr_u'), readingRow('rr_eu')),
    h('h3', { class: 'h3' }, 'As vogais nasais'),
    p('O n e o m depois da vogal não soam: eles só deixam a vogal nasal, como em mãe, bom e vim. São três, e elas mudam o sentido: vin (vinho), vent (vento), vont (vão).'),
    panel(['rr_an', 'rr_on', 'rr_in'].map(readingRow)),
    note('O ouvido aprende melhor com vozes diferentes dizendo a mesma coisa. Por isso cada rodada abaixo usa outra voz.'),
    !inSheet && practice('Treinar o ouvido', (done) => pairRound(shuffle(c.minimalPairs)[0], 'which', currentUser().id, done, nextSpeaker())),
  ];
}

function chapter5(inSheet: boolean): Child[] {
  const c = content();
  const r = c.readingRules.find((x) => x.id === 'rr_liaison');
  const examples = r ? r.examples.map(resolveExample) : [];
  return [
    p('A letra calada do fim acorda quando a palavra seguinte começa com vogal ou com h. Ela se junta à vogal, como se fosse uma palavra só.'),
    panel(examples.map((e) => example(e.fr, e.pt))),
    p('O s acorda como z, o t como t e o n como n. É por isso que o arco aparece embaixo das palavras nos diálogos.'),
    note('Depois de et (e), nunca liga: un café et un croissant. Se não tiver certeza, falar sem ligar também é entendido.'),
    !inSheet && liaisonPractice(),
  ];
}

function chapter6(): Child[] {
  return [
    p('Em francês há dois jeitos de dizer você. Tu é o próximo, de família e amigos. Vous é o educado, para quem você não conhece, e também serve para falar com várias pessoas.'),
    panel(
      example(`Vous êtes prêt${NB}?`, 'O senhor está pronto? (vous)'),
      example(`Tu es prêt${NB}?`, 'Você está pronto? (tu)'),
      example(`Comment vous appelez-vous${NB}?`, 'Como o senhor se chama?'),
      example(`Comment tu t'appelles${NB}?`, 'Como você se chama?'),
    ),
    p('Na Commune, no banco, no médico e com as educadoras: vous. Com as crianças, inclusive as da creche: tu.'),
    note(`Na dúvida, vous. Se a outra pessoa quiser mais proximidade, ela mesma propõe: On se tutoie${NB}? A gente se trata por tu?`),
  ];
}

function chapter7(): Child[] {
  return [
    p('Toda palavra francesa é masculina ou feminina, como em português. Le e un vão com as masculinas, la e une com as femininas. No plural, les e des servem para as duas.'),
    panel(
      example('le train, un train', 'o trem, um trem'),
      example('la gare, une gare', 'a estação, uma estação'),
      example('les enfants, des enfants', 'as crianças, umas crianças'),
      example("l'école, l'hôpital", 'a escola, o hospital'),
    ),
    p("Antes de vogal ou h, le e la viram l': l'école, l'hôpital."),
    p('Quase sempre o gênero é o mesmo do português: la maison, a casa; le café, o café. Algumas trocam, e vale reparar quando aparecem:'),
    panel(
      example('la voiture', 'o carro'),
      example('la mer', 'o mar'),
      example('le voyage', 'a viagem'),
    ),
    note('Uma ajuda: palavras em -age costumam ser masculinas (le voyage, le fromage) e em -tion e -té, femininas (la nation, la liberté).'),
  ];
}

function chapter8(): Child[] {
  return [
    p('Être quer dizer ser e também estar: o francês usa um verbo só para os dois. Avoir quer dizer ter.'),
    panel(
      example('je suis, tu es, il est, elle est', 'eu sou/estou, você é/está, ele é/está, ela é/está'),
      example('nous sommes, vous êtes, ils sont', 'nós somos/estamos, vocês são/estão, eles são/estão'),
      example("j'ai, tu as, il a, elle a", 'eu tenho, você tem, ele tem, ela tem'),
      example('nous avons, vous avez, ils ont', 'nós temos, vocês têm, eles têm'),
    ),
    p('Muita coisa se diz igual ao português:'),
    panel(
      example("J'ai trente ans.", 'Tenho trinta anos.'),
      example("J'ai faim.", 'Tenho fome.'),
      example('Je suis fatigué.', 'Estou cansado.'),
      example('Il est brésilien.', 'Ele é brasileiro.'),
    ),
    note('Na conversa, on quer dizer a gente e usa a mesma forma de il: on est, on a.'),
  ];
}

function chapter9(): Child[] {
  return [
    p('O não francês vem em duas partes que abraçam o verbo: ne antes, pas depois.'),
    panel(
      example('Je ne comprends pas.', 'Não entendo.'),
      example("Ce n'est pas grave.", 'Não é grave.'),
      example('Il ne mange pas.', 'Ele não come.'),
    ),
    p("Antes de vogal, ne vira n'. E na fala do dia a dia o ne costuma sumir: je sais pas. Na escrita e com desconhecidos, use os dois."),
    p('Com a mesma estrutura:'),
    panel(
      example('Je ne mange plus.', 'Não como mais.'),
      example('Je ne vois rien.', 'Não vejo nada.'),
      example('Il ne pleut jamais.', 'Nunca chove.'),
    ),
  ];
}

function chapter10(): Child[] {
  return [
    p('Há três jeitos de perguntar. O primeiro já basta para quase tudo.'),
    h('h3', { class: 'h3' }, '1. Só a voz subindo'),
    panel(example(`Vous êtes prêt${NB}?`, 'O senhor está pronto?'), example(`C'est loin${NB}?`, 'É longe?')),
    h('h3', { class: 'h3' }, '2. Com est-ce que na frente'),
    panel(example(`Est-ce que vous êtes prêt${NB}?`, 'O senhor está pronto?'), example(`Est-ce que c'est loin${NB}?`, 'É longe?')),
    h('h3', { class: 'h3' }, '3. Invertendo, o mais formal'),
    panel(example(`Êtes-vous prêt${NB}?`, 'O senhor está pronto?')),
    p('As palavras de pergunta:'),
    panel(
      example(`Où${NB}?`, 'Onde?'),
      example(`Quand${NB}?`, 'Quando?'),
      example(`Comment${NB}?`, 'Como?'),
      example(`Combien${NB}?`, 'Quanto?'),
      example(`Pourquoi${NB}?`, 'Por quê?'),
      example(`Qui${NB}?`, 'Quem?'),
      example(`Qu'est-ce que c'est${NB}?`, 'O que é isso?'),
    ),
    note(`Na fala, a palavra de pergunta pode ir para o fim: C'est où${NB}? Fica onde?`),
  ];
}

function chapter11(): Child[] {
  return [
    p('Em português você diz vou falar, vou comer. Em francês é igual: o verbo ir e depois a ação.'),
    panel(example('Je vais parler.', 'Eu vou falar.'), example('Je vais manger.', 'Eu vou comer.'), example('On va partir.', 'A gente vai sair.')),
    note('Pronto. Você já fala do futuro em francês.'),
  ];
}

function chapter12(): Child[] {
  return [
    p("Para contar o que aconteceu, o francês usa avoir + o verbo no particípio: j'ai mangé. Parece o nosso tenho comido, mas quer dizer comi."),
    panel(
      example("J'ai mangé.", 'Eu comi.'),
      example('Il a bien dormi.', 'Ele dormiu bem.'),
      example("Nous avons fini.", 'Nós terminamos.'),
    ),
    p('Verbos em -er fazem o particípio em -é, com o mesmo som: parler, parlé; manger, mangé. Outros comuns: fini, dormi, pris, fait, vu.'),
    p('Alguns verbos de movimento usam être no lugar de avoir: aller, venir, arriver, partir, sortir, rester.'),
    panel(example('Je suis arrivé hier.', 'Cheguei ontem.'), example('Elle est partie.', 'Ela saiu.')),
    note('Com être, o particípio concorda como adjetivo: il est parti, elle est partie. O som quase sempre é o mesmo.'),
  ];
}

function chapter13(inSheet: boolean): Child[] {
  const show = [1, 2, 3, 10, 16, 17, 20, 21, 30, 60, 70, 71, 75, 80, 90, 99];
  return [
    p('Até 69, os números seguem a lógica do português: vingt et un, trente-deux, soixante-cinq.'),
    p('Depois do 69 vem o famoso cálculo. 70 é sessenta e dez, 80 é quatro vezes vinte, 90 é quatro vezes vinte mais dez.'),
    panel(show.map((n) => rule(String(n), frenchNumber(n), frenchNumber(n)))),
    p('Em Luxemburgo se usa o padrão da França: soixante-dix, quatre-vingts, quatre-vingt-dix.'),
    panel(example('trois euros soixante-dix', '3,70 €'), example('cent euros', '100 €')),
    !inSheet && numbersPractice(),
  ];
}

/** Conteúdo de um capítulo (na página ou na folha "Entender melhor" do Momento). */
export function guideChapterContent(n: number, opts: { inSheet?: boolean } = {}): Child[] {
  const ch = GUIDE.find((g) => g.n === n) ?? GUIDE[0];
  const inSheet = !!opts.inSheet;
  const body =
    n === 1 ? chapter1(inSheet)
    : n === 2 ? chapter2()
    : n === 3 ? chapter3(inSheet)
    : n === 4 ? chapter4(inSheet)
    : n === 5 ? chapter5(inSheet)
    : n === 6 ? chapter6()
    : n === 7 ? chapter7()
    : n === 8 ? chapter8()
    : n === 9 ? chapter9()
    : n === 10 ? chapter10()
    : n === 11 ? chapter11()
    : n === 12 ? chapter12()
    : chapter13(inSheet);
  return [h('div', { class: 'art', 'data-testid': `guide-${ch.n}` }, h(inSheet ? 'h2' : 'h1', { class: inSheet ? 'h2 m0' : 'h1' }, ch.title), body)];
}

// ---- Práticas ----------------------------------------------------------------

/** Caixa de prática: um botão abre um exercício; no fim, dá para fazer outro. */
function practice(label: string, make: (done: () => void) => Exercise): HTMLElement {
  const box = h('div', { class: 'practice', 'data-testid': 'practice' });
  let current: Exercise | null = null;
  const start = () => {
    current?.cleanup?.();
    current = make(() => {
      current?.cleanup?.();
      current = null;
      stopSpeaking();
      idle('Fazer outra');
    });
    render(box, h('div', { class: 'card' }, current.el));
  };
  const idle = (text = label) => render(box, h('button', { class: 'btn2 btn2--full', type: 'button', onclick: start, 'data-testid': 'practice-start' }, text));
  idle();
  return h('section', null, h('h3', { class: 'h3' }, 'Prática curta'), box);
}

/** Ligação na prática: troque a palavra e veja onde a letra acorda. */
function liaisonPractice(): HTMLElement {
  const c = content();
  const frame = c.frameById.get('f_lia_cest_un');
  if (!frame) return h('div');
  const out = h('div', { class: 'card', 'aria-live': 'polite' }, h('p', { class: 'soft m0' }, 'Escolha uma palavra.'));
  const chips = frame.slot_pool_ids.map((id) => c.wordById.get(id)!).filter(Boolean).map((w) =>
    h('button', {
      class: 'chip', type: 'button', lang: 'fr',
      onclick: () => {
        const phrase = buildPhrase(frame, w);
        render(out, frenchSentence(phrase.fr, 'big m0'), h('p', { class: 'soft m0 mt2' }, phrase.pt));
        void speak(phrase.fr);
      },
    }, w.fr),
  );
  return h('section', null, h('h3', { class: 'h3' }, 'Prática curta'), p('Troque a palavra. Quando ela começa com vogal, o n de un acorda.'), out, h('div', { class: 'chips' }, chips));
}

/** Ouça um número e escolha qual foi. */
function numbersPractice(): HTMLElement {
  const box = h('div', { class: 'card', 'data-testid': 'numbers-practice' });
  const round = () => {
    const pool = shuffle([17, 21, 32, 45, 58, 66, 70, 71, 75, 76, 80, 84, 90, 91, 97, 99]);
    const target = pool[0];
    const options = shuffle(pool.slice(0, 3));
    const result = h('p', { class: 'soft m0', 'aria-live': 'polite' });
    let done = false;
    render(
      box,
      h('div', { class: 'row between' }, h('p', { class: 'q m0' }, 'Qual número você ouviu?'), playButton(frenchNumber(target), { label: 'Ouvir o número' })),
      h('div', { class: 'opts opts--three' }, options.map((n) => {
        const o = h('button', { class: 'opt', type: 'button' }, String(n));
        o.addEventListener('click', () => {
          if (done) return;
          if (n === target) {
            done = true;
            cue('right');
            o.classList.add('opt--right');
            result.replaceChildren(`Isso. ${frenchNumber(target)}. `, h('button', { class: 'link link--inline', type: 'button', onclick: round }, 'Outro número'));
          } else {
            cue('almost');
            o.classList.add('opt--tried');
            result.textContent = 'Quase. Ouve de novo e pense na conta: sessenta e dez, quatro vezes vinte.';
          }
        });
        return o;
      })),
      result,
    );
    void speak(frenchNumber(target));
  };
  render(box, h('button', { class: 'btn2 btn2--full', type: 'button', onclick: round }, 'Ouvir um número'));
  return h('section', null, h('h3', { class: 'h3' }, 'Prática curta'), box);
}

// ---- Telas -------------------------------------------------------------------

/** Momento concluído em que a chave de cada capítulo apareceu. */
async function seenIn(): Promise<Map<number, Momento>> {
  const done = await completedMomentos(currentUser().id);
  const out = new Map<number, Momento>();
  for (const m of content().momentos) if (done.has(m.id) && !out.has(m.key.chapter)) out.set(m.key.chapter, m);
  return out;
}

export const guideView: View = async () => {
  const seen = await seenIn();
  return {
    title: 'Como funciona',
    tab: 'guia',
    content: h(
      'div',
      null,
      h('h1', { class: 'h1' }, 'Como funciona'),
      h('p', { class: 'soft' }, 'O francês explicado a partir do português. Leia quando bater a curiosidade.'),
      h(
        'div',
        { class: 'panel' },
        GUIDE.map((g) =>
          h(
            'a',
            { class: 'list-row', href: `#/como-funciona/${g.n}`, dataset: { chapter: String(g.n) } },
            h('span', { class: 'grow' }, h('span', { class: 't' }, g.title), h('span', { class: 'd' }, seen.has(g.n) ? `Apareceu no momento “${seen.get(g.n)!.title}”` : g.desc)),
            icon('chevronRight', 18),
          ),
        ),
      ),
    ),
  };
};

export const guideChapterView: View = async ({ params }) => {
  const n = Number(params.n);
  const ch = GUIDE.find((g) => g.n === n);
  if (!ch) throw new Error('Capítulo não encontrado.');
  const seen = (await seenIn()).get(n);
  return {
    title: ch.title,
    tab: 'guia',
    back: '/como-funciona',
    backLabel: 'Como funciona',
    cleanup: stopSpeaking,
    content: h('div', null, seen && h('p', { class: 'fine', 'data-testid': 'seen-in' }, `Apareceu no momento “${seen.title}”.`), guideChapterContent(n)),
  };
};
