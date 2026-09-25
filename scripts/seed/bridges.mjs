// Pontes com o português, por palavra (chave = "fr" da palavra no banco).
// Só entra ponte quando a semelhança é real:
//   igual    mesma forma e mesmo sentido;
//   parecida forma quase igual, reconhecível;
//   origem   mesma origem verificável (a nota diz qual);
//   regra    regra de cognato (as palavras com cognate_rule_id ganham a ponte
//            automaticamente no build-seed; aqui só quando a nota precisa ser outra).
// Na dúvida, nada de etimologia: a palavra fica sem ponte e ganha, no máximo,
// uma dica de som no gancho de memória.
//
// Formato: fr: [tipo, português, nota]
export const BRIDGES = {
  // ---- Momento 1: Um café, por favor ----------------------------------------
  bonjour: ['origem', 'bom dia', 'Bon é bom. Jour é dia, parente de jornal e de jornada.'],
  vous: ['origem', 'vós', 'Vem do mesmo latim do nosso vós.'],
  servir: ['igual', 'servir', 'Do verbo servir, igual ao nosso. Je vous sers: eu lhe sirvo.'],
  un: ['parecida', 'um', 'Un é um.'],
  café: ['igual', 'café', 'Igualzinho.'],
  "s'il vous plaît": ['origem', 'se vos apraz', 'Ao pé da letra: se vos apraz, do jeito que se falava no português antigo.'],
  normal: ['igual', 'normal', 'Igual.'],
  ou: ['igual', 'ou', 'Igual.'],
  au: ['parecida', 'ao', 'Au é ao. Café au lait é café ao leite, como chocolate ao leite.'],
  lait: ['origem', 'leite', 'Lait e leite vêm da mesma palavra latina.'],
  et: ['parecida', 'e', 'Et é e. O t fica calado.'],
  croissant: ['igual', 'croissant', 'Essa você já usa.'],
  plaisir: ['parecida', 'prazer', 'Plaisir é prazer. Avec plaisir: com prazer.'],
  merci: ['origem', 'mercê', 'Parente de mercê, de vossa mercê, que virou você.'],
  // Opções do molde do Momento 1
  thé: ['origem', 'chá', 'Thé e chá vêm da mesma palavra chinesa, por caminhos diferentes.'],
  chocolat: ['parecida', 'chocolate', 'Chocolat é chocolate, sem o e do fim.'],
};

/**
 * Justificativa das pontes do tipo "origem" (vai para o relatório de conteúdo).
 * Só origens de dicionário etimológico, sem suposição.
 */
export const ORIGIN_NOTES = {
  bonjour: 'jour vem do latim diurnum (do dia); jornal e jornada vêm de diurnalis/diurnata, da mesma raiz. bon e bom vêm de bonus.',
  vous: 'francês vous e português vós vêm ambos do pronome latino vos.',
  "s'il vous plaît": 'plaire vem do latim placere; o português aprazer vem de ad + placere. "Se vos apraz" é a tradução literal.',
  lait: 'francês lait e português leite vêm do latim lac, lactis (acusativo lactem).',
  thé: 'o mesmo caractere chinês 茶: "chá" veio da pronúncia de Cantão (via Macau), "thé" da pronúncia de Fujian "te" (via Holanda).',
  merci: 'merci vem do latim mercedem (recompensa, graça), o mesmo de mercê; "vossa mercê" deu "você".',
};
