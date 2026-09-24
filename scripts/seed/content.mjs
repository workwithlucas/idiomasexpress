// Conteúdo estruturado do seed. Palavras são referenciadas pelo texto em
// francês (campo "fr"); o build-seed.mjs resolve para ids e falha se alguma
// referência não existir.

/** Regras de conversão PT → FR. Os exemplos são calculados a partir das
 *  palavras marcadas com o id da regra (coluna 6 dos arquivos de palavras). */
export const COGNATE_RULES = [
  { id: 'cr_cao_tion', pattern: '-ção → -tion', explanation: 'Quase todo substantivo em -ção tem um irmão francês em -tion (pronuncia-se "siõ").' },
  { id: 'cr_dade_te', pattern: '-dade → -té', explanation: 'Substantivos abstratos em -dade viram -té (sempre femininos).' },
  { id: 'cr_oso_eux', pattern: '-oso → -eux', explanation: 'Adjetivos em -oso terminam em -eux (feminino: -euse). O X final é mudo.' },
  { id: 'cr_mente_ment', pattern: '-mente → -ment', explanation: 'Advérbios: troque -mente por -ment (som nasal "mã").' },
  { id: 'cr_ario_aire', pattern: '-ário → -aire', explanation: 'Palavras em -ário/-ária terminam em -aire (som "ér").' },
  { id: 'cr_vel_ble', pattern: '-vel → -ble', explanation: 'Adjetivos em -vel viram -ble: possível → possible.' },
  { id: 'cr_ista_iste', pattern: '-ista → -iste', explanation: 'Profissões e adeptos em -ista terminam em -iste.' },
  { id: 'cr_ico_ique', pattern: '-ico/-ica → -ique', explanation: 'Terminações -ico e -ica viram -ique (som "ik").' },
  { id: 'cr_ia_ie', pattern: '-ia → -ie', explanation: 'Substantivos em -ia terminam em -ie (o E final é mudo).' },
  { id: 'cr_or_eur', pattern: '-or → -eur', explanation: 'Agentes e qualidades em -or viram -eur (som "ër").' },
  { id: 'cr_ancia_ance', pattern: '-ância/-ência → -ance/-ence', explanation: 'Ambas soam igual em francês: nasal "ãs".' },
  { id: 'cr_ivo_if', pattern: '-ivo → -if', explanation: 'Adjetivos em -ivo terminam em -if (feminino: -ive).' },
  { id: 'cr_al_el', pattern: '-al → -el', explanation: 'Muitos adjetivos em -al viram -el (mas "normal" e "final" continuam iguais).' },
  { id: 'cr_agem_age', pattern: '-agem → -age', explanation: 'Substantivos em -agem terminam em -age (som "aj").' },
  { id: 'cr_izar_iser', pattern: '-izar → -iser', explanation: 'Verbos em -izar viram -iser (som "izê").' },
  { id: 'cr_ar_er', pattern: 'verbos -ar → -er', explanation: 'Muitos verbos em -ar têm o infinitivo em -er (som "ê"): passar → passer.' },
  { id: 'cr_ura_ure', pattern: '-ura → -ure', explanation: 'Substantivos em -ura terminam em -ure (com o "u" francês).' },
  { id: 'cr_eiro_ier', pattern: '-eiro → -ier', explanation: 'Profissões e meses em -eiro terminam em -ier (som "iê").' },
  { id: 'cr_es_e', pattern: 'es- → é-', explanation: 'O "es-" inicial do português costuma virar "é-" em francês: escola → école.' },
  { id: 'cr_circ_s', pattern: 'â ê î ô û = S que caiu', explanation: 'O acento circunflexo marca um S antigo: coloque o S de volta e a palavra aparece (hôpital → hospital).' },
];

/** Falsos cognatos: parecem palavras do português mas significam outra coisa. */
export const FALSE_COGNATES = [
  { word: 'attendre', looks_like: 'atender', warning: 'Significa ESPERAR. "Atender o telefone" = répondre au téléphone.' },
  { word: 'entendre', looks_like: 'entender', warning: 'Significa OUVIR. "Entender" = comprendre.' },
  { word: 'rester', looks_like: 'restar', warning: 'Significa FICAR. Je reste à la maison = fico em casa.' },
  { word: 'demander', looks_like: 'demandar', warning: 'Significa PEDIR ou PERGUNTAR. Je demande l\'addition = peço a conta.' },
  { word: 'sortir', looks_like: 'sortear', warning: 'Significa SAIR. La sortie = a saída.' },
  { word: 'parents', looks_like: 'parentes', warning: 'Significa PAIS (pai e mãe). Parentes = la famille.' },
  { word: 'mais', looks_like: 'mais', warning: 'Significa MAS. "Mais" em francês é plus.' },
  { word: 'salir', looks_like: 'sair', warning: 'Significa SUJAR. "Sair" = sortir.' },
  { word: 'sale', looks_like: 'sala', warning: 'Significa SUJO. "Sala" = salle.' },
  { word: 'tirer', looks_like: 'tirar', warning: 'Significa PUXAR (ou atirar). Em portas: "Tirez" = puxe.' },
  { word: 'pousser', looks_like: 'pousar', warning: 'Significa EMPURRAR. Em portas: "Poussez" = empurre.' },
  { word: 'propre', looks_like: 'próprio', warning: 'Depois do substantivo significa LIMPO: une chambre propre = um quarto limpo.' },
  { word: 'casser', looks_like: 'casar', warning: 'Significa QUEBRAR. "Casar" = se marier.' },
  { word: 'embrasser', looks_like: 'abraçar', warning: 'Significa BEIJAR. "Abraçar" = serrer dans ses bras.' },
  { word: 'prétendre', looks_like: 'pretender', warning: 'Significa AFIRMAR, ALEGAR. "Pretender" = avoir l\'intention de.' },
  { word: 'facteur', looks_like: 'fator', warning: 'Le facteur é o CARTEIRO. "Fator" = le facteur só em matemática/ciência.' },
];

/** Pares mínimos: dificuldades reais de ouvido para brasileiros. */
export const MINIMAL_PAIRS = [
  { a: 'jeune', b: 'jaune', feature: 'œ (boca aberta arredondada) × o fechado' },
  { a: 'vin', b: 'vent', feature: 'nasal ɛ̃ ("ẽ") × nasal ɑ̃ ("ã")' },
  { a: 'vent', b: 'vont', feature: 'nasal ɑ̃ ("ã") × nasal ɔ̃ ("õ")' },
  { a: 'vin', b: 'vont', feature: 'nasal ɛ̃ ("ẽ") × nasal ɔ̃ ("õ")' },
  { a: 'sans', b: 'son', feature: 'nasal ɑ̃ × nasal ɔ̃' },
  { a: 'tu', b: 'tout', feature: 'u francês [y] × u português [u]' },
  { a: 'rue', b: 'roue', feature: 'u francês [y] × u português [u]' },
  { a: 'dessus', b: 'dessous', feature: 'u francês [y] × u português [u]' },
  { a: 'vu', b: 'vous', feature: 'u francês [y] × u português [u]' },
  { a: 'vie', b: 'vu', feature: 'i [i] × u francês [y]' },
  { a: 'deux', b: 'des', feature: 'ø (e com bico) × e' },
  { a: 'le', b: 'les', feature: 'ə (e neutro) × e fechado' },
  { a: 'cheveux', b: 'chevaux', feature: 'ø × o' },
  { a: 'peur', b: 'pour', feature: 'œ × u' },
  { a: 'beau', b: 'bon', feature: 'vogal oral o × nasal ɔ̃' },
  { a: 'poisson', b: 'poison', feature: 'ss = [s] × s entre vogais = [z]' },
  { a: 'dessert', b: 'désert', feature: 'ss = [s] × s = [z]' },
];

/**
 * Regras de leitura letra → som. Exemplos: string = palavra do banco
 * (resolvida por "fr"); objeto = expressão avulsa (liaison, elisão).
 */
export const READING_RULES = [
  { id: 'rr_eau', grapheme: 'eau · au', sound: 'o', tip_pt: 'Soa "ô" fechado, sempre.', examples: ['eau', 'beau', 'au', 'chaud', 'bureau'] },
  { id: 'rr_ou', grapheme: 'ou', sound: 'u', tip_pt: 'É o nosso "u" normal.', examples: ['vous', 'nous', 'pour', 'jour', 'tout'] },
  { id: 'rr_u', grapheme: 'u', sound: 'y', tip_pt: 'Diga "i" e faça bico com os lábios, sem mexer a língua.', examples: ['tu', 'rue', 'bus', 'salut', 'minute'] },
  { id: 'rr_oi', grapheme: 'oi', sound: 'wa', tip_pt: 'Soa "uá": moi = "muá".', examples: ['moi', 'toi', 'trois', 'voir', 'soir'] },
  { id: 'rr_ai', grapheme: 'ai · ei', sound: 'ɛ', tip_pt: 'Soa "é" aberto, nunca "ai".', examples: ['mais', 'faire', 'vrai', 'semaine', 'français'] },
  { id: 'rr_e_aigu', grapheme: 'é', sound: 'e', tip_pt: 'Acento agudo = "ê" fechado.', examples: ['café', 'bébé', 'école', 'idée', 'désolé'] },
  { id: 'rr_e_grave', grapheme: 'è · ê', sound: 'ɛ', tip_pt: 'Acento grave ou circunflexo = "é" aberto.', examples: ['père', 'mère', 'très', 'tête', 'fête'] },
  { id: 'rr_e_muet', grapheme: 'e (sem acento, fim de sílaba)', sound: 'ə', tip_pt: 'Um "e" neutro e curtinho, que muitas vezes some na fala.', examples: ['le', 'je', 'ne', 'petit', 'demain'] },
  { id: 'rr_e_final', grapheme: 'e final', sound: '∅', tip_pt: 'O E no fim da palavra é mudo, mas faz a consoante anterior soar.', examples: ['femme', 'porte', 'livre', 'place', 'monde'] },
  { id: 'rr_eu', grapheme: 'eu · œu', sound: 'ø / œ', tip_pt: 'Diga "ê" (ou "é") fazendo bico: um som que não existe em português.', examples: ['deux', 'peu', 'vieux', 'heure', 'sœur'] },
  { id: 'rr_an', grapheme: 'an · en · am · em', sound: 'ɑ̃', tip_pt: 'Nasal "ã" com a boca bem aberta; o N não é pronunciado.', examples: ['enfant', 'temps', 'dans', 'chambre', 'argent'] },
  { id: 'rr_on', grapheme: 'on · om', sound: 'ɔ̃', tip_pt: 'Nasal "õ" com lábios arredondados.', examples: ['bon', 'non', 'nom', 'maison', 'monde'] },
  { id: 'rr_in', grapheme: 'in · ain · ein · im', sound: 'ɛ̃', tip_pt: 'Nasal "ẽ" aberto — parecido com o "ã", mas com a boca mais esticada.', examples: ['vin', 'pain', 'demain', 'main', 'important'] },
  { id: 'rr_ien', grapheme: 'ien', sound: 'jɛ̃', tip_pt: 'Soa "iẽ": bien, rien.', examples: ['bien', 'rien', 'chien', 'entretien'] },
  { id: 'rr_un', grapheme: 'un · um', sound: 'œ̃', tip_pt: 'Nasal "ũ" aberto; hoje muitos franceses falam igual a "in".', examples: ['un', 'quelqu\'un', { fr: 'lundi', ipa: 'lœ̃di', pt: 'segunda-feira' }] },
  { id: 'rr_final_cons', grapheme: 'consoante final', sound: '∅', tip_pt: 'A maioria das consoantes no fim da palavra é muda.', examples: ['petit', 'grand', 'trop', 'temps', 'dos'] },
  { id: 'rr_careful', grapheme: 'C R F L finais', sound: 'k ʁ f l', tip_pt: 'Exceção "CaReFuL": C, R, F e L finais costumam ser pronunciados.', examples: ['avec', 'sac', 'neuf', 'chef', 'seul'] },
  { id: 'rr_er', grapheme: '-er · -ez · et', sound: 'e', tip_pt: 'No fim do verbo, -er soa "ê" (o R é mudo). Idem -ez e a palavra "et".', examples: ['parler', 'manger', 'aller', 'chez', 'et'] },
  { id: 'rr_ch', grapheme: 'ch', sound: 'ʃ', tip_pt: 'Soa como o nosso "x" de "xícara".', examples: ['chat', 'chose', 'chambre', 'chercher', 'chien'] },
  { id: 'rr_gn', grapheme: 'gn', sound: 'ɲ', tip_pt: 'É o nosso "nh".', examples: ['gagner', 'signer', 'signature', 'magnifique'] },
  { id: 'rr_ill', grapheme: 'ill · il (após vogal)', sound: 'j', tip_pt: 'Soa "i" semivogal (como em "iate"). Exceções: ville, mille = "il".', examples: ['fille', 'famille', 'travailler', 'bouteille', 'meilleur'] },
  { id: 'rr_h', grapheme: 'h', sound: '∅', tip_pt: 'O H nunca é pronunciado.', examples: ['homme', 'heure', 'hier', 'hôpital', 'histoire'] },
  { id: 'rr_r', grapheme: 'r', sound: 'ʁ', tip_pt: 'Sempre no fundo da garganta, como um "rr" de "carro" bem suave — mesmo entre vogais.', examples: ['rue', 'rien', 'trois', 'froid', 'rester'] },
  { id: 'rr_j', grapheme: 'j · g + e/i', sound: 'ʒ', tip_pt: 'Como o "j" de "janela" — nunca "dj".', examples: ['je', 'jour', 'jeune', 'manger', 'argent'] },
  { id: 'rr_g', grapheme: 'g + a/o/u · gu', sound: 'ɡ', tip_pt: 'G duro, como em "gato". Em "gu" + e/i, o U é mudo.', examples: ['gare', 'gagner', 'fatigué', 'guichet'] },
  { id: 'rr_c', grapheme: 'ç · c + e/i', sound: 's', tip_pt: 'Soa "s": ça, merci.', examples: ['ça', 'merci', 'ici', 'français', 'façon'] },
  { id: 'rr_qu', grapheme: 'qu', sound: 'k', tip_pt: 'Sempre "k", o U é mudo.', examples: ['que', 'qui', 'quoi', 'question', 'quand'] },
  { id: 'rr_s_z', grapheme: 's entre vogais', sound: 'z', tip_pt: 'Um S sozinho entre vogais soa "z".', examples: ['maison', 'chose', 'poison', 'désolé', 'raison'] },
  { id: 'rr_ss', grapheme: 'ss', sound: 's', tip_pt: 'Dois S = som de "s".', examples: ['passer', 'poisson', 'aussi', 'dessert', 'adresse'] },
  { id: 'rr_tion', grapheme: '-tion', sound: 'sjɔ̃', tip_pt: 'Soa "siõ".', examples: ['question', 'nation', 'situation', 'information', 'attention'] },
  { id: 'rr_oy', grapheme: 'oy · ay', sound: 'waj · ɛj', tip_pt: 'Entre vogais o Y vira "i" duplo: voyage = "vua-iaj".', examples: ['voyage', 'envoyer', 'essayer', 'payer'] },
  { id: 'rr_ph', grapheme: 'ph', sound: 'f', tip_pt: 'Soa "f".', examples: ['pharmacie', 'téléphone', 'photographie'] },
  { id: 'rr_e_double', grapheme: 'e + consoante dupla', sound: 'ɛ', tip_pt: 'Antes de consoante dupla, o E soa "é" aberto.', examples: ['elle', 'cette', 'mettre', 'dessert'] },
  { id: 'rr_liaison', grapheme: 'liaison', sound: '‿', tip_pt: 'A consoante final muda "acorda" quando a próxima palavra começa com vogal.', examples: [
    { fr: 'vous avez', ipa: 'vuzave', pt: 'vocês têm' },
    { fr: 'les enfants', ipa: 'lezɑ̃fɑ̃', pt: 'as crianças' },
    { fr: 'deux ans', ipa: 'døzɑ̃', pt: 'dois anos' },
    { fr: 'un petit ami', ipa: 'œ̃ pətitami', pt: 'um namorado' },
  ] },
  { id: 'rr_elision', grapheme: "élision (j' l' c')", sound: '’', tip_pt: 'Je, le, la, ce, ne, de perdem a vogal antes de outra vogal.', examples: [
    { fr: "j'ai", ipa: 'ʒe', pt: 'eu tenho' },
    { fr: "l'eau", ipa: 'lo', pt: 'a água' },
    { fr: "c'est", ipa: 'sɛ', pt: 'é, isto é' },
    { fr: "l'homme", ipa: 'lɔm', pt: 'o homem' },
  ] },
];

/** Frames: moldes de frase com um slot "___". pt usa o mesmo marcador. */
export const FRAMES = [
  // Cotidiano
  { id: 'f_je_veux', template: 'je veux ___', pt: 'eu quero ___', slot: ['manger', 'dormir', 'partir', 'parler', 'jouer', 'sortir'] },
  { id: 'f_je_peux', template: 'je peux ___ ?', pt: 'posso ___?', slot: ['entrer', 'payer', 'attendre', 'parler', 'sortir', 'venir'] },
  { id: 'f_je_vais', template: 'je vais ___', pt: 'eu vou ___', slot: ['travailler', 'manger', 'dormir', 'payer', 'revenir'] },
  { id: 'f_il_faut', template: 'il faut ___', pt: 'é preciso ___', slot: ['partir', 'attendre', 'payer', 'manger', 'signer'] },
  { id: 'f_cest_tres', template: "c'est très ___", pt: 'é muito ___', slot: ['bon', 'important', 'difficile', 'facile', 'cher', 'beau', 'pratique'] },
  { id: 'f_comprends_pas', template: 'je ne comprends pas le ___', pt: 'não entendo o(a) ___', slot: ['mot', 'problème', 'numéro', 'document', 'contrat'] },
  // Lugares
  { id: 'f_ou_la', template: 'où est la ___ ?', pt: 'onde fica o(a) ___?', slot: ['banque', 'gare', 'pharmacie', 'caisse', 'sortie', 'crèche', 'boulangerie', 'commune'] },
  { id: 'f_ou_le', template: 'où est le ___ ?', pt: 'onde fica o(a) ___?', slot: ['bureau', 'guichet', 'bus', 'train', 'distributeur', 'médecin'] },
  // Pedidos
  { id: 'f_voudrais_un', template: 'je voudrais un ___', pt: 'eu queria um(a) ___', slot: ['café', 'rendez-vous', 'compte', 'crédit', 'virement', 'formulaire'] },
  { id: 'f_voudrais_une', template: 'je voudrais une ___', pt: 'eu queria um(a) ___', slot: ['carte', 'attestation', 'bouteille', 'chambre', 'facture'] },
  { id: 'f_voudrais_du', template: 'je voudrais du ___', pt: 'eu queria ___', slot: ['pain', 'lait', 'fromage', 'poulet', 'café', 'beurre'] },
  { id: 'f_combien_coute', template: 'combien coûte le ___ ?', pt: 'quanto custa o ___?', slot: ['pain', 'lait', 'fromage', 'poulet', 'vin', 'café'] },
  { id: 'f_besoin_un', template: "j'ai besoin d'un ___", pt: 'preciso de um(a) ___', slot: ['médicament', 'rendez-vous', 'médecin', 'certificat', 'formulaire', 'passeport'] },
  // Creche
  { id: 'f_mon_malade', template: 'mon ___ est malade', pt: 'meu ___ está doente', slot: ['fils', 'mari', 'bébé', 'père', 'frère'] },
  { id: 'f_ma_malade', template: 'ma ___ est malade', pt: 'minha ___ está doente', slot: ['fille', 'femme', 'mère', 'sœur'] },
  { id: 'f_chercher_mon', template: 'je viens chercher mon ___', pt: 'vim buscar meu ___', slot: ['fils', 'bébé'] },
  { id: 'f_oublie_son', template: 'il a oublié son ___', pt: 'ele esqueceu o(a) ___ dele', slot: ['doudou', 'biberon', 'jouet', 'sac'] },
  { id: 'f_heure_le', template: 'à quelle heure est le ___ ?', pt: 'a que horas é o(a) ___?', slot: ['goûter', 'repas'] },
  { id: 'f_heure_la', template: 'à quelle heure est la ___ ?', pt: 'a que horas é a ___?', slot: ['sieste', 'fête'] },
  { id: 'f_il_a_de_la', template: 'il a de la ___', pt: 'ele está com ___', slot: ['fièvre', 'toux'] },
  // Banco
  { id: 'f_argent', template: "je voudrais ___ de l'argent", pt: 'eu queria ___ dinheiro', slot: ['retirer', 'déposer', 'envoyer', 'changer'] },
  { id: 'f_perdu_ma', template: "j'ai perdu ma ___", pt: 'perdi meu/minha ___', slot: ['carte', 'clé'] },
  // Entrevista
  { id: 'f_parle', template: 'je parle ___', pt: 'eu falo ___', slot: ['français', 'portugais', 'anglais', 'allemand', 'luxembourgeois'] },
  { id: 'f_travaille_comme', template: 'je travaille comme ___', pt: 'trabalho como ___', slot: ['ingénieur', 'professeur', 'développeur', 'infirmier', 'cuisinier', 'journaliste'], note_pt: 'Formas femininas: ingénieure, professeure, développeuse, infirmière, cuisinière.' },
  { id: 'f_ans_experience', template: "j'ai ___ ans d'expérience", pt: 'tenho ___ anos de experiência', slot: ['deux', 'trois', 'cinq', 'six', 'dix'] },
  { id: 'f_je_suis', template: 'je suis ___', pt: 'eu sou ___', slot: ['motivé', 'disponible', 'responsable', 'créatif', 'professionnel'], note_pt: 'Para Eduarda (feminino): motivée, créative, professionnelle. Disponible e responsable não mudam.' },
  // Médico
  { id: 'f_mal_a_la', template: "j'ai mal à la ___", pt: 'estou com dor no(a) ___', slot: ['tête', 'gorge', 'jambe', 'main'] },
  { id: 'f_mal_au', template: "j'ai mal au ___", pt: 'estou com dor no(a) ___', slot: ['ventre', 'dos', 'bras', 'pied'] },
  // Commune
  { id: 'f_dois', template: 'je dois ___', pt: 'eu preciso ___', slot: ['signer', 'payer', 'attendre', 'revenir', 'partir'] },
  { id: 'f_voici', template: 'voici mon ___', pt: 'aqui está meu/minha ___', slot: ['passeport', 'contrat', 'document', 'certificat', 'numéro'] },
];

/** Cenas: reaproveitam palavras e frames já cadastrados. */
export const SCENES = [
  { id: 'sc_cotidiano', name: 'Dia a dia', icon: 'sun', description: 'Cumprimentos e frases que salvam qualquer conversa.',
    words: ['bonjour', 'bonsoir', 'salut', 'au revoir', 'merci', "s'il vous plaît", 'excusez-moi', 'pardon', "d'accord", 'oui', 'non', 'désolé', 'comprendre', 'parler', 'aider', 'bien', 'attendre'],
    frames: ['f_je_veux', 'f_je_peux', 'f_je_vais', 'f_il_faut', 'f_cest_tres', 'f_comprends_pas'] },
  { id: 'sc_creche', name: 'Creche', icon: 'baby', description: 'Buscar, avisar que está doente, combinar horários.',
    words: ['crèche', 'enfant', 'bébé', 'fils', 'fille', 'couche', 'biberon', 'sieste', 'doudou', 'goûter', 'jouet', 'éducatrice', 'fièvre', 'vêtements', 'malade', 'chercher', 'école', 'repas', 'heure', 'dormir', 'manger'],
    frames: ['f_mon_malade', 'f_ma_malade', 'f_chercher_mon', 'f_oublie_son', 'f_heure_le', 'f_heure_la', 'f_il_a_de_la'] },
  { id: 'sc_banco', name: 'Banco', icon: 'bank', description: 'Abrir conta, cartão, transferências e tarifas.',
    words: ['banque', 'compte', 'carte', 'argent', 'virement', 'crédit', 'frais', 'code', 'distributeur', 'guichet', 'salaire', 'facture', 'intérêt', 'coût', 'banquier', 'payer', 'retirer', 'déposer', 'envoyer', 'signer', 'signature', 'rendez-vous'],
    frames: ['f_voudrais_un', 'f_voudrais_une', 'f_argent', 'f_perdu_ma', 'f_ou_le'] },
  { id: 'sc_entrevista', name: 'Entrevista de emprego', icon: 'briefcase', description: 'Apresentar-se, experiência, idiomas e disponibilidade.',
    words: ['entretien', 'poste', 'expérience', 'compétence', 'diplôme', 'équipe', 'entreprise', 'contrat', 'salaire', 'horaire', 'travail', 'travailler', 'disponible', 'motivé', 'responsable', 'professionnel', 'objectif', 'français', 'anglais', 'allemand', 'portugais', 'luxembourgeois', 'ingénieur', 'développeur', 'professeur', 'étudiant'],
    frames: ['f_parle', 'f_travaille_comme', 'f_ans_experience', 'f_je_suis'] },
  { id: 'sc_medico', name: 'Médico e farmácia', icon: 'health', description: 'Marcar consulta, explicar sintomas, pegar remédio.',
    words: ['médecin', 'docteur', 'rendez-vous', 'pharmacie', 'ordonnance', 'médicament', 'hôpital', 'urgence', 'douleur', 'fièvre', 'toux', 'tête', 'gorge', 'ventre', 'dos', 'bras', 'jambe', 'main', 'pied', 'malade', 'mal', 'température'],
    frames: ['f_mal_a_la', 'f_mal_au', 'f_besoin_un', 'f_il_a_de_la', 'f_ou_la'] },
  { id: 'sc_mercado', name: 'Supermercado', icon: 'cart', description: 'Pedir, perguntar preço e pagar no caixa.',
    words: ['pain', 'lait', 'fromage', 'poulet', 'viande', 'légumes', 'fruit', 'pomme', 'œuf', 'beurre', 'café', 'vin', 'eau', 'poisson', 'caisse', 'sac', 'prix', 'kilo', 'bouteille', 'boulangerie', 'cher', 'acheter', 'payer', 'sortie', 'délicieux'],
    frames: ['f_voudrais_du', 'f_combien_coute', 'f_voudrais_une', 'f_ou_la'] },
  { id: 'sc_commune', name: 'Commune (prefeitura)', icon: 'building', description: 'Registro de residência, formulários e documentos.',
    words: ['commune', 'formulaire', 'document', 'certificat', 'attestation', 'déclaration', 'passeport', "pièce d'identité", 'résidence', 'logement', 'loyer', 'adresse', 'nom', 'numéro', 'signature', 'signer', 'remplir', 'guichet', 'bureau', 'rendez-vous', 'information', 'étranger', 'attendre'],
    frames: ['f_dois', 'f_besoin_un', 'f_voici', 'f_ou_le'] },
];

export const USERS = [
  { id: 'u_lucas', name: 'Lucas', household_id: 'hh_lux' },
  { id: 'u_eduarda', name: 'Eduarda', household_id: 'hh_lux' },
];
