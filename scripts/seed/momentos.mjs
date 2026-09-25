// A trilha: capítulos na ordem da vida de quem chega e, em cada um, os Momentos.
//
// Cada Momento é uma cena curta da vida real em Luxemburgo, com um arco fixo:
// escutar → ver o que já sabe → uma chave → montar → falar → levar consigo.
//
// Falas: [quem fala, francês marcado, português]. No francês, cada palavra do
// banco vai entre colchetes: [texto] ou [texto|palavra do banco] ou
// [texto|palavra do banco|tradução desta forma]. Tudo fora dos colchetes é
// pontuação ou nome próprio. O build-seed confere que toda palavra existe e
// calcula word_ids; a tipografia francesa (espaço fino antes de ! ? : ;) é
// aplicada no build.
//
// Par mínimo (opcional): pair: 'rue/roue', com uma das palavras no diálogo;
// pronoun ('Ela' ou 'Ele') é quem fala com você, para a pergunta do passo 1.
//
// Chave: exemplos com a parte em destaque entre colchetes ("vou[s]"), sempre
// tirados do diálogo. apply: palavras novas para prever e depois ouvir.

export const CHAPTERS = [
  { id: 'ch1', title: 'Primeiros passos', scene: 'sc_cotidiano' },
  { id: 'ch2', title: 'A Commune', scene: 'sc_lu_commune' },
  { id: 'ch3', title: 'Creche e CSA', scene: 'sc_lu_creche' },
  { id: 'ch4', title: 'Supermercado', scene: 'sc_lu_mercado' },
  { id: 'ch5', title: 'Transporte', scene: 'sc_lu_transporte' },
  { id: 'ch6', title: 'Médico e farmácia', scene: 'sc_lu_pediatra' },
  { id: 'ch7', title: 'Banco', scene: 'sc_lu_banco' },
  { id: 'ch8', title: 'Vizinhança', scene: 'sc_lu_vizinhanca' },
  { id: 'ch9', title: 'Entrevista de emprego', scene: 'sc_lu_entrevista' },
];

export const MOMENTOS = [
  // ===========================================================================
  // Capítulo 1 · Primeiros passos
  // ===========================================================================
  {
    id: 'm01', chapter: 'ch1',
    title: 'Um café, por favor',
    can_do: 'pedir algo num café',
    intro: 'Primeira manhã em Luxemburgo. Você entra no café da esquina e a atendente fala com você.',
    lines: [
      ['Atendente', "[Bonjour] ! [Qu'est-ce que] [je] [vous] [sers|servir|sirvo] ?", 'Bom dia! O que eu lhe sirvo?'],
      ['Você', "[Bonjour]. [Un] [café], [s'il vous plaît].", 'Bom dia. Um café, por favor.'],
      ['Atendente', '[Un] [café] [normal] [ou] [un] [café] [au] [lait] ?', 'Um café normal ou um café com leite?'],
      ['Você', "[Au] [lait]. [Et] [un] [croissant], [s'il vous plaît].", 'Com leite. E um croissant, por favor.'],
      ['Atendente', '[Avec] [plaisir].', 'Com prazer.'],
      ['Você', '[Merci] !', 'Obrigado!'],
    ],
    key: {
      kind: 'leitura', ref: 'rr_final_cons', name: 'letras caladas', chapter: 2,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['vou[s]', 'lai[t]', 'plaî[t]'],
      question: 'O que acontece com a última letra?',
      options: ['Ela soa forte, como em português', 'Ela fica calada', 'Ela vira um i'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo e repara só no finalzinho.',
      reveal: 'Isso. Em francês, a consoante do fim costuma ficar calada. Vous soa vu, lait soa lé, plaît soa plé.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra da letra do fim.',
      apply: [
        { fr: 'chocolat', pt: 'chocolate', options: ['chocolá', 'chocolát'], correct: 0 },
        { fr: 'petit', pt: 'pequeno', options: ['petít', 'petí'], correct: 1 },
      ],
      extra: 'Um detalhe: c, r, f e l costumam aparecer no fim. Pense na palavra inglesa careful. Por isso avec soa avék e bonjour termina com r.',
    },
    frame: {
      title: 'Monte o seu pedido', intro: 'Troque o que você quer pedir quantas vezes quiser. Cada frase toca sozinha.',
      template: "un ___, s'il vous plaît.", pt: 'um ___, por favor.', slot: ['café', 'thé', 'croissant', 'chocolat chaud', "verre d'eau"] },
  },
];
