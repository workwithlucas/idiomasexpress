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
  {
    id: 'm02', chapter: 'ch1', pronoun: 'Ele',
    title: 'Me apresentar',
    can_do: 'dizer de onde você vem e quanto fala de francês',
    intro: 'Um vizinho puxa conversa no elevador. Hora de dizer quem você é.',
    lines: [
      ['Vizinho', '[Bonjour] ! [Vous] [habitez|habiter|mora] [ici] ?', 'Bom dia! Você mora aqui?'],
      ['Você', '[Oui]. [Je] [viens|venir|venho] [du] Brésil.', 'Sim. Venho do Brasil.'],
      ['Vizinho', '[Et] [vous] [parlez|parler|fala] [français] ?', 'E você fala francês?'],
      ['Você', "[Un] [peu], [mais] [j'|je][apprends|apprendre|estou aprendendo].", 'Um pouco, mas estou aprendendo.'],
      ['Vizinho', '[Parfait] ! [Un] [café], [un] [jour] ?', 'Perfeito! Um café qualquer dia?'],
      ['Você', '[Avec] [plaisir]. [Merci] !', 'Com prazer. Obrigado!'],
    ],
    key: {
      kind: 'leitura', ref: 'rr_ai', name: 'ai soa é', chapter: 3,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['franç[ai]s', 'm[ai]s', 'parf[ai]t'],
      question: 'Como soa o ai?',
      options: ['Ai, como em pai', 'É, como em pé', 'A, como em lá'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo: ninguém diz ai.',
      reveal: 'Isso. Em francês, ai soa é aberto, como em pé. Français soa françé, mais soa mé, parfait soa parfé.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: ai soa é.',
      apply: [
        { fr: 'vrai', pt: 'verdadeiro', options: ['vrái', 'vré'], correct: 1 },
        { fr: 'semaine', pt: 'semana', options: ['semén', 'semáine'], correct: 0 },
      ],
      extra: 'E repare no parfait: o t do fim fica calado, a chave do seu primeiro momento.',
    },
    frame: {
      title: 'Monte a sua pergunta', intro: 'Troque a língua quantas vezes quiser. Cada frase toca sozinha.',
      template: 'vous parlez ___ ?', pt: 'você fala ___?', slot: ['français', 'anglais', 'allemand', 'portugais', 'luxembourgeois'],
    },
  },
  {
    id: 'm03', chapter: 'ch1', pair: 'vu/vous',
    title: 'Não entendi, pode repetir?',
    can_do: 'pedir para repetirem mais devagar',
    intro: 'Na padaria, a atendente fala rápido demais. Você pede para ela repetir.',
    lines: [
      ['Atendente', '[Bonjour] ! [Et] [pour] [vous] ?', 'Bom dia! E para você?'],
      ['Você', "[Un] [croissant], [s'il vous plaît].", 'Um croissant, por favor.'],
      ['Atendente', '[Sur place] [ou] [à emporter] ?', 'Para comer aqui ou para levar?'],
      ['Você', '[Pardon] ? [Vous] [pouvez|pouvoir|pode] [répéter] [plus] [lentement] ?', 'Desculpe? Pode repetir mais devagar?'],
      ['Atendente', '[Pour] [manger] [ici] [ou] [pour] [emporter] ?', 'Para comer aqui ou para levar?'],
      ['Você', '[Pour] [emporter]. [Merci] [beaucoup] !', 'Para levar. Muito obrigado!'],
    ],
    key: {
      kind: 'leitura', ref: 'rr_ou', name: 'ou soa u', chapter: 3,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['p[ou]r', 'v[ou]s', 'p[ou]vez'],
      question: 'Como soam as letras ou?',
      options: ['Ou, como em outro', 'U, como em tudo', 'Ô, como em avô'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo e repara no som do meio.',
      reveal: 'Isso. Em francês, ou soa como o nosso u. Pour soa pur, vous soa vu, pouvez soa puvê.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: ou soa u.',
      apply: [
        { fr: 'jour', pt: 'dia', options: ['jur', 'jôur'], correct: 0 },
        { fr: 'rouge', pt: 'vermelho', options: ['rôuj', 'ruj'], correct: 1 },
      ],
      extra: 'E o u sozinho? É outro som, com biquinho. Ele aparece daqui a pouco.',
    },
    frame: {
      title: 'Monte o seu pedido de ajuda', intro: 'Troque o verbo quantas vezes quiser. Cada frase toca sozinha.',
      template: 'vous pouvez ___ plus lentement ?', pt: 'pode ___ mais devagar?', slot: ['répéter', 'parler', 'expliquer', 'lire'],
    },
  },
  {
    id: 'm04', chapter: 'ch1',
    title: 'Quanto custa?',
    can_do: 'perguntar quanto é e pagar',
    intro: 'Hora de pagar o café. Você chama a atendente no balcão.',
    lines: [
      ['Você', '[Pardon], [je] [vous] [dois|devoir|devo] [combien] ?', 'Desculpe, quanto lhe devo?'],
      ['Atendente', "[Un] [café] [et] [un] [croissant]… [c'|ce][est|être|são] [trois] [euros|euro], [s'il vous plaît].", 'Um café e um croissant… são três euros, por favor.'],
      ['Você', '[Je] [peux|pouvoir|posso] [payer] [par] [carte] ?', 'Posso pagar com cartão?'],
      ['Atendente', '[Oui], [bien sûr]. [Voilà].', 'Sim, claro. Aqui está.'],
      ['Você', '[Merci]. [Bonne] [journée] !', 'Obrigado. Tenha um bom dia!'],
    ],
    key: {
      kind: 'leitura', ref: 'rr_oi', name: 'oi soa uá', chapter: 3,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['d[oi]s', 'tr[oi]s', 'v[oi]là'],
      question: 'Como soam as letras oi?',
      options: ['Ói, como em herói', 'Uá, como em água', 'Ô, como em avô'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo e repara que o oi vira duas vogais diferentes.',
      reveal: 'Isso. Em francês, oi soa uá. Dois soa duá, trois soa truá, voilà soa vualá.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: oi soa uá.',
      apply: [
        { fr: 'moi', pt: 'eu, mim', options: ['mói', 'muá'], correct: 1 },
        { fr: 'soir', pt: 'noite', options: ['suár', 'sóir'], correct: 0 },
      ],
      extra: 'O s de trois e o s de dois ficam calados, como você já viu.',
    },
    frame: {
      title: 'Monte a sua pergunta', intro: 'Troque o jeito de pagar quantas vezes quiser. Cada frase toca sozinha.',
      template: 'je peux payer par ___ ?', pt: 'posso pagar com ___?', slot: ['carte', 'chèque', 'virement', 'téléphone'],
    },
  },
  {
    id: 'm05', chapter: 'ch1',
    title: 'Onde fica?',
    can_do: 'perguntar onde fica um lugar e entender o caminho',
    intro: 'Você precisa de uma farmácia e pergunta para uma senhora na rua.',
    lines: [
      ['Você', "[Pardon], [madame]. [La] [pharmacie], [s'il vous plaît] ?", 'Desculpe, senhora. A farmácia, por favor?'],
      ['Senhora', '[Vous] [allez|aller|vai] [tout droit]…', 'Você vai em frente…'],
      ['Senhora', "…[et] [au] [bout] [de] [la] [rue], [à] [gauche].", '…e no fim da rua, à esquerda.'],
      ['Você', '[Tout droit], [puis] [à] [gauche]. [Merci] [beaucoup] !', 'Em frente, depois à esquerda. Muito obrigado!'],
      ['Senhora', '[Avec] [plaisir]. [Bonne] [journée] !', 'Com prazer. Tenha um bom dia!'],
    ],
    key: {
      kind: 'leitura', ref: 'rr_eau', name: 'eau e au soam ô', chapter: 3,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['[au]', 'g[au]che', 'b[eau]coup'],
      question: 'Como soam au e eau?',
      options: ['Au, como em mau', 'Ô, como em avô', 'Éu, como em chapéu'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo: o som é um só.',
      reveal: 'Isso. Em francês, au e eau soam ô, fechado. Au soa ô, gauche soa gôch, beaucoup soa bôcu.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: au e eau soam ô.',
      apply: [
        { fr: 'eau', pt: 'água', options: ['ô', 'éau'], correct: 0 },
        { fr: 'chaud', pt: 'quente', options: ['cháud', 'chô'], correct: 1 },
      ],
      extra: 'Três letras, um som só: eau, a água, soa apenas ô.',
    },
    frame: {
      title: 'Monte a sua pergunta', intro: 'Troque o lugar quantas vezes quiser. Cada frase toca sozinha.',
      template: "la ___, s'il vous plaît ?", pt: 'a ___, por favor?', slot: ['pharmacie', 'gare', 'banque', 'commune', 'boulangerie'],
    },
  },

  // ===========================================================================
  // Capítulo 2 · A Commune
  // ===========================================================================
  {
    id: 'm06', chapter: 'ch2',
    title: 'Chegar ao guichê',
    can_do: 'dizer no guichê o que você veio fazer',
    intro: 'Primeira vez na Commune. A funcionária do guichê chama você.',
    lines: [
      ['Funcionária', "[Bonjour]. [Qu'est-ce que] [je] [peux|pouvoir|posso] [faire] [pour] [vous] ?", 'Bom dia. O que posso fazer por você?'],
      ['Você', "[Bonjour]. [Je] [viens|venir|venho] [pour] [une] [déclaration] [d'|de][arrivée].", 'Bom dia. Venho fazer a declaração de chegada.'],
      ['Funcionária', '[Vous] [avez|avoir|tem] [un] [rendez-vous] ?', 'Você tem horário marcado?'],
      ['Você', '[Non], [pardon].', 'Não, desculpe.'],
      ['Funcionária', '[Pas de problème]. [Prenez|prendre|pegue] [un] [ticket] [et] [attendez|attendre|espere] [un] [moment].', 'Sem problema. Pegue uma senha e espere um pouco.'],
      ['Você', "[D'accord]. [Merci] !", 'Combinado. Obrigado!'],
    ],
    key: {
      kind: 'som', ref: 'rr_an', name: 'an e en soam ã', chapter: 4,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['r[en]dez-vous', 'att[en]dez', 'mom[en]t'],
      question: 'Como soa o en?',
      options: ['En, com o n bem marcado', 'Ã, como em lã', 'Ê, como em você'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo e repara: o n não aparece.',
      reveal: 'Isso. En e an soam ã, nasal, e o n some. Rendez-vous soa rãdevú, attendez soa atãdê, moment soa momã.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: en e an soam ã, sem o n.',
      apply: [
        { fr: 'enfant', pt: 'criança', options: ['ãfã', 'enfánt'], correct: 0 },
        { fr: 'dans', pt: 'dentro, em', options: ['dans', 'dã'], correct: 1 },
      ],
      extra: 'O mesmo acontece com am e em: chambre soa xãbr.',
    },
    frame: {
      title: 'Monte o seu pedido', intro: 'Troque o documento quantas vezes quiser. Cada frase toca sozinha.',
      template: 'je viens pour une ___.', pt: 'venho fazer uma ___.', slot: ['déclaration', 'inscription', 'attestation', 'demande'],
    },
  },
  {
    id: 'm07', chapter: 'ch2', pair: 'rue/roue',
    title: 'Dizer o seu endereço',
    can_do: 'dizer onde você mora',
    intro: 'Para a declaração, a funcionária pede o seu endereço.',
    lines: [
      ['Funcionária', "[Votre] [adresse], [s'il vous plaît] ?", 'Seu endereço, por favor?'],
      ['Você', "[J'|je][habite|habiter|moro] [au] [douze], [rue] [de] [la] [Gare|gare].", 'Moro no número doze da Rue de la Gare.'],
      ['Funcionária', '[Pardon] ? [Quelle|quel] [rue] ?', 'Desculpe? Qual rua?'],
      ['Você', "[Rue] [de] [la] [Gare|gare], [numéro] [douze]. [C'|ce][est|être|é] [une] [petite|petit|pequena] [rue].", 'Rue de la Gare, número doze. É uma rua pequena.'],
      ['Funcionária', '[Et] [à] [quel] [étage] ?', 'E em que andar?'],
      ['Você', '[Au] [troisième] [étage].', 'No terceiro andar.'],
    ],
    key: {
      kind: 'som', ref: 'rr_u', name: 'u com biquinho', chapter: 4,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['r[u]e', 'n[u]méro', '[u]ne'],
      question: 'Como soa o u francês?',
      options: ['U, como em tudo', 'I com biquinho, um som que o português não tem', 'Ô, como em avô'],
      correct: 1,
      hint: 'Quase. Ouve de novo: não é o nosso u. Diga i e faça bico.',
      reveal: 'Isso. O u francês é um i dito com os lábios em bico. O nosso u, em francês, se escreve ou: rue é rua, roue é roda.',
      apply_question: 'Qual é o som com biquinho?',
      apply_hint: 'Quase. O biquinho vem do u sozinho, não do ou.',
      apply: [
        { fr: 'tu', pt: 'você (informal)', options: ['tu, com biquinho', 'tu, como em tudo'], correct: 0 },
        { fr: 'bus', pt: 'ônibus', options: ['bus, como em ônibus', 'büs, com biquinho'], correct: 1 },
      ],
      extra: 'Truque: diga ii, deixe a língua parada e arredonde os lábios. Pronto, u francês.',
    },
    frame: {
      title: 'Monte o seu endereço', intro: 'Troque o número quantas vezes quiser. Cada frase toca sozinha.',
      template: "j'habite au ___, rue de la Gare.", pt: 'moro no número ___ da Rue de la Gare.', slot: ['douze', 'trois', 'cinq', 'huit', 'vingt'],
    },
  },
  {
    id: 'm08', chapter: 'ch2',
    title: 'Os documentos da família',
    can_do: 'entregar os documentos que pedirem',
    intro: 'Na Commune, a funcionária confere os papéis da família.',
    lines: [
      ['Funcionária', '[Pour] [la] [déclaration], [vous] [avez|avoir|tem] [vos|votre|seus] [passeports|passeport|passaportes] ?', 'Para a declaração, você tem os passaportes?'],
      ['Você', '[Oui]. [Voilà] [les] [passeports|passeport|passaportes].', 'Sim. Aqui estão os passaportes.'],
      ['Funcionária', '[Merci]. [Et] [une] [attestation] [de] [logement] ?', 'Obrigada. E um comprovante de moradia?'],
      ['Você', '[Voilà] [le] [contrat] [de] [bail].', 'Aqui está o contrato de aluguel.'],
      ['Funcionária', "[Parfait]. [Pour] [l'|le][inscription] [des|de|das] [enfants|enfant|crianças] [à] [l'|la][école], [c'|ce][est|être|é] [à côté].", 'Perfeito. Para a matrícula das crianças na escola, é aqui ao lado.'],
      ['Você', "[D'accord]. [Merci] [pour] [l'|la][information] !", 'Combinado. Obrigado pela informação!'],
    ],
    key: {
      kind: 'ponte', ref: 'cr_cao_tion', name: '-ção vira -tion', chapter: 1,
      intro: 'Ouça estas três palavras da conversa e pense no português.',
      examples: [{ fr: 'déclara[tion]', pt: 'declaração' }, { fr: 'attesta[tion]', pt: 'atestação' }, { fr: 'informa[tion]', pt: 'informação' }],
      question: 'O que o -tion do francês é no português?',
      options: ['-ção', '-dade', '-mente'],
      correct: 0,
      hint: 'Quase. Diga declaração em voz alta e compare com o fim de déclaration.',
      reveal: 'Isso. Quase toda palavra em -ção tem uma irmã francesa em -tion, que soa ciõ. Declaração, déclaration; informação, information.',
      apply_question: 'Como é em francês?',
      apply_hint: 'Quase. Troque o -ção por -tion.',
      apply: [
        { fr: 'solution', pt: 'solução', options: ['solution', 'solução'], correct: 0 },
        { fr: 'question', pt: 'questão', options: ['questão', 'question'], correct: 1 },
      ],
      extra: 'São centenas: nation, situation, attention, réservation. Você já conhece todas.',
    },
    frame: {
      title: 'Monte a sua frase', intro: 'Troque o documento quantas vezes quiser. Cada frase toca sozinha.',
      template: 'voilà le ___.', pt: 'aqui está o ___.', slot: ['passeport', 'contrat', 'document', 'certificat', 'formulaire'],
    },
  },
  {
    id: 'm09', chapter: 'ch2', pair: 'beau/bon',
    title: 'Marcar um horário',
    can_do: 'marcar um horário por telefone',
    intro: 'Você liga para a Commune para voltar com o documento que faltou.',
    lines: [
      ['Você', "[Bonjour]. [Je] [voudrais|vouloir|queria] [un] [rendez-vous], [s'il vous plaît].", 'Bom dia. Eu queria marcar um horário, por favor.'],
      ['Funcionária', "[Oui]. [Lundi] [à] [onze] [heures|heure], [c'|ce][est|être|é] [bon] [pour] [vous] ?", 'Sim. Segunda às onze horas, está bom para você?'],
      ['Você', "[Non], [lundi] [je] [travaille|travailler|trabalho]. [Mardi], [c'|ce][est|être|é] [possible] ?", 'Não, segunda eu trabalho. Terça, é possível?'],
      ['Funcionária', '[Mardi] [à] [neuf] [heures|heure] ?', 'Terça às nove horas?'],
      ['Você', "[C'|ce][est|être|é] [bon]. [Merci], [à] [mardi] !", 'Está bom. Obrigado, até terça!'],
    ],
    key: {
      kind: 'som', ref: 'rr_on', name: 'on soa õ', chapter: 4,
      intro: 'Ouça estas três palavras da conversa.',
      examples: ['b[on]', 'n[on]', '[on]ze'],
      question: 'Como soa o on?',
      options: ['On, com o n bem marcado', 'Õ, como em bom', 'U, como em tudo'],
      correct: 1,
      hint: 'Quase. Ouve as três de novo e repara: o n some.',
      reveal: 'Isso. On soa õ, como no nosso bom. Bon soa bõ, non soa nõ, onze soa õz.',
      apply_question: 'Como soa?',
      apply_hint: 'Quase. Lembra: on soa õ, sem o n.',
      apply: [
        { fr: 'maison', pt: 'casa', options: ['mezõ', 'mezón'], correct: 0 },
        { fr: 'nom', pt: 'nome', options: ['nom', 'nõ'], correct: 1 },
      ],
      extra: 'Com m é igual: nom soa nõ.',
    },
    frame: {
      title: 'Monte a sua pergunta', intro: 'Troque o dia quantas vezes quiser. Cada frase toca sozinha.',
      template: "___, c'est possible ?", pt: '___, é possível?', slot: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
    },
  },

  // ===========================================================================
  // Capítulo 3 · Creche e CSA
  // ===========================================================================
  {
    id: 'm10', chapter: 'ch3',
    title: 'Primeiro dia na creche',
    can_do: 'apresentar seu filho na creche',
    intro: 'Primeiro dia da Léa na creche. A educadora recebe vocês na porta.',
    lines: [
      ['Educadora', '[Bonjour] ! [Vous] [êtes|être|são] [la] [famille] [de] Léa ?', 'Bom dia! Vocês são a família da Léa?'],
      ['Você', "[Oui], [bonjour]. [C'|ce][est|être|é] [son] [premier] [jour].", 'Sim, bom dia. É o primeiro dia dela.'],
      ['Educadora', '[Bienvenue] ! [Et] [toi], [tu] [es|être|é] Léa ? [Tu] [veux|vouloir|quer] [jouer] ?', 'Bem-vindos! E você, é a Léa? Quer brincar?'],
      ['Você', '[Elle] [est|être|é] [un] [peu] [timide].', 'Ela é um pouco tímida.'],
      ['Educadora', '[Pas de problème]. [Vous] [pouvez|pouvoir|pode] [rester] [un] [moment] [avec] [elle].', 'Sem problema. Você pode ficar um pouco com ela.'],
      ['Você', "[Merci]. [À tout à l'heure], Léa !", 'Obrigado. Até daqui a pouco, Léa!'],
    ],
    key: {
      kind: 'gramatica', ref: 'g_tu_vous', name: 'tu ou vous', chapter: 6,
      intro: 'Ouça como a educadora fala com você e com a Léa.',
      examples: ['[Vous] êtes', '[tu] es', '[Tu] veux'],
      question: 'Por que ela usa vous com você e tu com a Léa?',
      options: ['Vous é o educado, para adultos; tu, para crianças e gente próxima', 'Vous é mais carinhoso que tu', 'Tanto faz, os dois são iguais'],
      correct: 0,
      hint: 'Quase. Pense em quem é adulto e quem é criança na cena.',
      reveal: 'Isso. Vous é o você educado, para quem você não conhece. Tu é o próximo, para crianças, amigos e família.',
      apply_question: 'Com quem você fala assim?',
      apply_hint: 'Quase. Tu é para crianças e gente próxima.',
      apply: [
        { fr: "Comment tu t'appelles ?", pt: 'Como você se chama?', options: ['Com uma criança', 'Com o funcionário do banco'], correct: 0 },
        { fr: 'Vous avez un stylo ?', pt: 'O senhor tem uma caneta?', options: ['Com a sua filha', 'Com alguém que você não conhece'], correct: 1 },
      ],
      extra: 'Na dúvida, vous. Se a pessoa quiser mais proximidade, ela mesma propõe o tu.',
    },
    frame: {
      title: 'Monte uma pergunta para a Léa', intro: 'Troque a atividade quantas vezes quiser. Cada frase toca sozinha.',
      template: 'tu veux ___ ?', pt: 'você quer ___?', slot: ['jouer', 'manger', 'dormir', 'venir'],
    },
  },
  {
    id: 'm11', chapter: 'ch3',
    title: 'Avisar que a criança está doente',
    can_do: 'avisar que a criança está doente e não vai',
    intro: 'A Léa acordou com febre. Você liga para a creche antes das oito.',
    lines: [
      ['Você', "[Bonjour], [c'|ce][est|être|é] [la] [famille] [de] Léa.", 'Bom dia, é a família da Léa.'],
      ['Educadora', '[Bonjour] ! [Ça va] ?', 'Bom dia! Tudo bem?'],
      ['Você', "[Non]. Léa [est|être|está] [malade], [elle] [a|avoir|tem] [de] [la] [fièvre]. [Elle] [ne] [vient|venir|vem] [pas] [aujourd'hui].", 'Não. A Léa está doente, está com febre. Ela não vem hoje.'],
      ['Educadora', "[Ce] [n'|ne][est|être|é] [pas] [grave]. [Elle] [mange|manger|come] [bien] ?", 'Não é grave. Ela está comendo bem?'],
      ['Você', '[Non], [elle] [ne] [mange|manger|come] [pas] [beaucoup].', 'Não, ela não come muito.'],
      ['Educadora', '[Merci] [de] [prévenir]. [Bon] [courage] !', 'Obrigada por avisar. Força!'],
    ],
    key: {
      kind: 'gramatica', ref: 'g_ne_pas', name: 'ne… pas', chapter: 9,
      intro: 'Ouça estas três frases da conversa.',
      examples: ['elle [ne] vient [pas]', "Ce [n']est [pas]", 'elle [ne] mange [pas]'],
      question: 'Como se diz não em francês?',
      options: ['Só com pas, antes do verbo', 'Com ne antes do verbo e pas depois', 'Com non no fim da frase'],
      correct: 1,
      hint: 'Quase. Repare onde ficam o ne e o pas em relação ao verbo.',
      reveal: 'Isso. O não francês tem duas partes que abraçam o verbo: ne antes, pas depois. Antes de vogal, ne vira n’.',
      apply_question: 'O que quer dizer?',
      apply_hint: 'Quase. Ne… pas é o não.',
      apply: [
        { fr: 'Je ne comprends pas.', pt: 'Não entendo.', options: ['Não entendo.', 'Entendo.'], correct: 0 },
        { fr: 'Il ne dort pas.', pt: 'Ele não dorme.', options: ['Ele dorme.', 'Ele não dorme.'], correct: 1 },
      ],
      extra: 'Na fala rápida, o ne às vezes some: je sais pas. O pas nunca some.',
    },
    frame: {
      title: 'Monte o seu aviso', intro: 'Troque o dia quantas vezes quiser. Cada frase toca sozinha.',
      template: 'elle ne vient pas ___.', pt: 'ela não vem ___.', slot: ["aujourd'hui", 'demain', 'lundi', 'mardi', 'mercredi'],
    },
  },
  {
    id: 'm12', chapter: 'ch3',
    title: 'Combinar o horário de buscar',
    can_do: 'combinar a que horas você vem buscar a criança',
    intro: 'De manhã, na porta da creche, a educadora pergunta quem vem buscar a Léa.',
    lines: [
      ['Educadora', '[Vous] [venez|venir|vem] [chercher] Léa [à] [quelle|quel] [heure] ?', 'A que horas você vem buscar a Léa?'],
      ['Você', "[Aujourd'hui], [je] [vais|aller|vou] [venir] [à] [seize] [heures|heure].", 'Hoje eu vou vir às dezesseis horas.'],
      ['Educadora', "[D'accord]. [Et] [demain] ?", 'Combinado. E amanhã?'],
      ['Você', '[Demain], [sa|son|a] [grand-mère] [va|aller|vai] [venir] [après] [le] [travail].', 'Amanhã a avó dela vai vir depois do trabalho.'],
      ['Educadora', '[Très] [bien]. [On] [va|aller|vai] [faire] [une] [petite|petit|pequena] [fête] [demain].', 'Muito bem. A gente vai fazer uma festinha amanhã.'],
      ['Você', '[Super] ! Léa [va|aller|vai] [adorer].', 'Que ótimo! A Léa vai adorar.'],
    ],
    key: {
      kind: 'gramatica', ref: 'g_aller', name: 'ir + verbo', chapter: 11,
      intro: 'Ouça estas três frases da conversa.',
      examples: ['je [vais] venir', 'on [va] faire', 'Léa [va] adorer'],
      question: 'Como o francês fala do que vai acontecer?',
      options: ['Com o verbo ir e depois a ação, como vou vir', 'Mudando o fim do verbo', 'Com a palavra demain antes'],
      correct: 0,
      hint: 'Quase. Compare je vais venir com o português eu vou vir.',
      reveal: 'Isso. É igual ao português: ir e depois a ação. Je vais venir, eu vou vir. On va faire, a gente vai fazer.',
      apply_question: 'O que quer dizer?',
      apply_hint: 'Quase. Vais e va são o verbo ir.',
      apply: [
        { fr: 'Je vais manger.', pt: 'Eu vou comer.', options: ['Eu vou comer.', 'Eu comi.'], correct: 0 },
        { fr: 'Elle va dormir.', pt: 'Ela vai dormir.', options: ['Ela dormiu.', 'Ela vai dormir.'], correct: 1 },
      ],
      extra: 'Je vais, tu vas, il va, on va: as formas mudam pouco, e o verbo da ação fica igual.',
    },
    frame: {
      title: 'Monte o seu combinado', intro: 'Troque a hora quantas vezes quiser. Cada frase toca sozinha.',
      template: 'je vais venir à ___ heures.', pt: 'vou vir às ___ horas.', slot: ['quatre', 'cinq', 'six', 'seize'],
    },
  },
  {
    id: 'm13', chapter: 'ch3',
    title: 'Conversar com a educadora',
    can_do: 'perguntar como foi o dia da criança',
    intro: 'No fim da tarde, você busca a Léa e pergunta como foi o dia.',
    lines: [
      ['Você', '[Bonjour] ! [Ça va] ? Léa [a|avoir] [bien] [dormi|dormir|dormiu] ?', 'Oi! Tudo bem? A Léa dormiu bem?'],
      ['Educadora', '[Oui], [elle] [a|avoir] [dormi|dormir|dormiu] [une] [heure] [après] [le] [repas].', 'Sim, ela dormiu uma hora depois do almoço.'],
      ['Você', '[Et] [elle] [a|avoir] [mangé|manger|comeu] [du] [poisson] ?', 'E ela comeu o peixe?'],
      ['Educadora', '[Oui], [tout] ! [Et] [elle] [a|avoir] [beaucoup] [joué|jouer|brincou].', 'Sim, tudo! E ela brincou muito.'],
      ['Você', '[Super]. [Merci] [pour] [tout] !', 'Que ótimo. Obrigado por tudo!'],
      ['Educadora', '[Avec] [plaisir]. [À] [demain], Léa !', 'Com prazer. Até amanhã, Léa!'],
    ],
    key: {
      kind: 'gramatica', ref: 'g_passe', name: 'o passado com avoir', chapter: 12,
      intro: 'Ouça estas três frases da conversa.',
      examples: ['elle [a] dorm[i]', 'elle [a] mang[é]', '[a] beaucoup jou[é]'],
      question: 'Como o francês conta o que já aconteceu?',
      options: ['Com a (de avoir) e o verbo com outro final: a mangé', 'Com o verbo ir: va manger', 'Não muda nada'],
      correct: 0,
      hint: 'Quase. Repare no a antes do verbo e no fim do verbo.',
      reveal: 'Isso. Para o passado, o francês usa avoir e o verbo com outro final: elle a mangé, ela comeu. Verbos em -er terminam em -é, com o mesmo som.',
      apply_question: 'O que quer dizer?',
      apply_hint: 'Quase. A + verbo terminado em -é é passado.',
      apply: [
        { fr: "J'ai parlé.", pt: 'Eu falei.', options: ['Eu falei.', 'Eu vou falar.'], correct: 0 },
        { fr: 'Il a travaillé.', pt: 'Ele trabalhou.', options: ['Ele trabalha.', 'Ele trabalhou.'], correct: 1 },
      ],
      extra: 'Parece o nosso tenho comido, mas quer dizer comi: é o passado do dia a dia.',
    },
    frame: {
      title: 'Monte a sua pergunta', intro: 'Troque a comida quantas vezes quiser. Cada frase toca sozinha.',
      template: 'elle a mangé du ___ ?', pt: 'ela comeu ___?', slot: ['poisson', 'poulet', 'riz', 'fromage', 'pain'],
    },
  },
];
