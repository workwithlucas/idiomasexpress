// Vocabulário complementar (além das 300 mais frequentes), necessário para:
//  - ilustrar as regras de cognatos,
//  - formar os pares mínimos e os falsos cognatos,
//  - cobrir as cenas práticas (creche, banco, entrevista, médico, mercado, commune).
// Recebem freq_rank a partir de 301, na ordem em que aparecem aqui
// (ordem de utilidade dentro do complemento, NÃO posição real no corpus).
// Mesmo formato de words-core.mjs.
export const EXTRA_WORDS = `
contre | contra | kɔ̃tʁ | | | |
chien | cachorro | ʃjɛ̃ | cotidiano | m | | Chien → "canino".
chat | gato | ʃa | cotidiano | m | | Soa "xá": o gato tomando chá.
gentil | gentil, simpático | ʒɑ̃ti | descricao | | |
long | longo, comprido | lɔ̃ | descricao | | |
surtout | sobretudo | syʁtu | | | | sur (sobre) + tout (tudo).
nation | nação | nasjɔ̃ | cotidiano | f | cr_cao_tion |
situation | situação | sitɥasjɔ̃ | cotidiano | f | cr_cao_tion |
information | informação | ɛ̃fɔʁmasjɔ̃ | administracao | f | cr_cao_tion |
attention | atenção | atɑ̃sjɔ̃ | cotidiano | f | cr_cao_tion |
solution | solução | sɔlysjɔ̃ | trabalho | f | cr_cao_tion |
déclaration | declaração | deklaʁasjɔ̃ | administracao | f | cr_cao_tion |
attestation | atestado, declaração | atɛstasjɔ̃ | administracao | f | cr_cao_tion |
liberté | liberdade | libɛʁte | cotidiano | f | cr_dade_te |
université | universidade | ynivɛʁsite | trabalho | f | cr_dade_te |
qualité | qualidade | kalite | descricao | f | cr_dade_te |
réalité | realidade | ʁealite | cotidiano | f | cr_dade_te |
possibilité | possibilidade | pɔsibilite | cotidiano | f | cr_dade_te |
société | sociedade; empresa | sɔsjete | trabalho | f | cr_dade_te |
vérité | verdade | veʁite | cotidiano | f | cr_dade_te |
délicieux | delicioso | delisjø | compras | | cr_oso_eux |
curieux | curioso | kyʁjø | descricao | | cr_oso_eux |
nerveux | nervoso | nɛʁvø | sentimentos | | cr_oso_eux |
généreux | generoso | ʒeneʁø | descricao | | cr_oso_eux |
courageux | corajoso | kuʁaʒø | descricao | | cr_oso_eux |
précieux | precioso | pʁesjø | descricao | | cr_oso_eux |
exactement | exatamente | ɛɡzaktəmɑ̃ | | | cr_mente_ment |
simplement | simplesmente | sɛ̃pləmɑ̃ | | | cr_mente_ment |
finalement | finalmente | finalmɑ̃ | | | cr_mente_ment |
normalement | normalmente | nɔʁmalmɑ̃ | | | cr_mente_ment |
absolument | absolutamente | apsɔlymɑ̃ | | | cr_mente_ment |
rapidement | rapidamente | ʁapidmɑ̃ | | | cr_mente_ment |
salaire | salário | salɛʁ | banco | m | cr_ario_aire |
dictionnaire | dicionário | diksjɔnɛʁ | cotidiano | m | cr_ario_aire |
nécessaire | necessário | nesesɛʁ | descricao | | cr_ario_aire |
anniversaire | aniversário | anivɛʁsɛʁ | cotidiano | m | cr_ario_aire |
vocabulaire | vocabulário | vɔkabylɛʁ | cotidiano | m | cr_ario_aire |
horaire | horário | ɔʁɛʁ | trabalho | m | cr_ario_aire |
formulaire | formulário | fɔʁmylɛʁ | administracao | m | cr_ario_aire |
terrible | terrível | tɛʁibl | descricao | | cr_vel_ble |
impossible | impossível | ɛ̃pɔsibl | descricao | | cr_vel_ble |
responsable | responsável | ʁɛspɔ̃sabl | trabalho | | cr_vel_ble |
agréable | agradável | aɡʁeabl | descricao | | cr_vel_ble |
disponible | disponível | dispɔnibl | trabalho | | cr_vel_ble |
incroyable | incrível | ɛ̃kʁwajabl | descricao | | cr_vel_ble |
dentiste | dentista | dɑ̃tist | saude | m | cr_ista_iste |
touriste | turista | tuʁist | cotidiano | m | cr_ista_iste |
artiste | artista | aʁtist | cotidiano | m | cr_ista_iste |
journaliste | jornalista | ʒuʁnalist | trabalho | m | cr_ista_iste |
musique | música | myzik | cotidiano | f | cr_ico_ique |
politique | política | pɔlitik | cotidiano | f | cr_ico_ique |
pratique | prático | pʁatik | descricao | | cr_ico_ique |
magnifique | magnífico | maɲifik | descricao | | cr_ico_ique |
fantastique | fantástico | fɑ̃tastik | descricao | | cr_ico_ique |
électrique | elétrico | elɛktʁik | casa | | cr_ico_ique |
pharmacie | farmácia | faʁmasi | saude | f | cr_ia_ie |
économie | economia | ekɔnɔmi | banco | f | cr_ia_ie |
énergie | energia | enɛʁʒi | casa | f | cr_ia_ie |
photographie | fotografia | fɔtɔɡʁafi | cotidiano | f | cr_ia_ie |
catégorie | categoria | kateɡɔʁi | cotidiano | f | cr_ia_ie |
professeur | professor | pʁɔfesœʁ | trabalho | m | cr_or_eur |
directeur | diretor | diʁɛktœʁ | trabalho | m | cr_or_eur |
acteur | ator | aktœʁ | cotidiano | m | cr_or_eur |
valeur | valor | valœʁ | banco | f | cr_or_eur |
développeur | desenvolvedor | devlɔpœʁ | trabalho | m | cr_or_eur |
importance | importância | ɛ̃pɔʁtɑ̃s | cotidiano | f | cr_ancia_ance |
distance | distância | distɑ̃s | transporte | f | cr_ancia_ance |
expérience | experiência | ɛkspeʁjɑ̃s | trabalho | f | cr_ancia_ance |
patience | paciência | pasjɑ̃s | sentimentos | f | cr_ancia_ance |
urgence | urgência; emergência | yʁʒɑ̃s | saude | f | cr_ancia_ance |
compétence | competência | kɔ̃petɑ̃s | trabalho | f | cr_ancia_ance |
résidence | residência | ʁezidɑ̃s | administracao | f | cr_ancia_ance |
positif | positivo | pozitif | descricao | | cr_ivo_if |
négatif | negativo | neɡatif | descricao | | cr_ivo_if |
actif | ativo | aktif | descricao | | cr_ivo_if |
créatif | criativo | kʁeatif | trabalho | | cr_ivo_if |
objectif | objetivo | ɔbʒɛktif | trabalho | m | cr_ivo_if |
naturel | natural | natyʁɛl | descricao | | cr_al_el |
personnel | pessoal | pɛʁsɔnɛl | descricao | | cr_al_el |
professionnel | profissional | pʁɔfesjɔnɛl | trabalho | | cr_al_el |
officiel | oficial | ɔfisjɛl | administracao | | cr_al_el |
réel | real | ʁeɛl | descricao | | cr_al_el |
voyage | viagem | vwajaʒ | transporte | m | cr_agem_age |
message | mensagem | mesaʒ | cotidiano | m | cr_agem_age |
courage | coragem | kuʁaʒ | sentimentos | m | cr_agem_age |
image | imagem | imaʒ | cotidiano | f | cr_agem_age |
garage | garagem | ɡaʁaʒ | casa | m | cr_agem_age |
organiser | organizar | ɔʁɡanize | trabalho | | cr_izar_iser |
utiliser | utilizar, usar | ytilize | verbos | | cr_izar_iser |
réaliser | realizar | ʁealize | trabalho | | cr_izar_iser |
finaliser | finalizar | finalize | trabalho | | cr_izar_iser |
accepter | aceitar | aksɛpte | verbos | | cr_ar_er |
adorer | adorar | adɔʁe | verbos | | cr_ar_er |
continuer | continuar | kɔ̃tinɥe | verbos | | cr_ar_er |
préparer | preparar | pʁepaʁe | casa | | cr_ar_er |
imaginer | imaginar | imaʒine | verbos | | cr_ar_er |
visiter | visitar | vizite | verbos | | cr_ar_er |
signer | assinar | siɲe | administracao | | cr_ar_er |
retirer | sacar, retirar | ʁətiʁe | banco | | cr_ar_er |
déposer | depositar | depoze | banco | | cr_ar_er |
culture | cultura | kyltyʁ | cotidiano | f | cr_ura_ure |
aventure | aventura | avɑ̃tyʁ | cotidiano | f | cr_ura_ure |
température | temperatura | tɑ̃peʁatyʁ | saude | f | cr_ura_ure |
facture | fatura, conta | faktyʁ | banco | f | cr_ura_ure |
signature | assinatura | siɲatyʁ | administracao | f | cr_ura_ure |
peinture | pintura | pɛ̃tyʁ | casa | f | cr_ura_ure |
janvier | janeiro | ʒɑ̃vje | tempo | m | cr_eiro_ier |
février | fevereiro | fevʁije | tempo | m | cr_eiro_ier |
banquier | bancário, banqueiro | bɑ̃kje | banco | m | cr_eiro_ier |
infirmier | enfermeiro | ɛ̃fiʁmje | saude | m | cr_eiro_ier |
cuisinier | cozinheiro | kɥizinje | trabalho | m | cr_eiro_ier |
étudiant | estudante | etydjɑ̃ | trabalho | m | cr_es_e |
étranger | estrangeiro | etʁɑ̃ʒe | administracao | m | cr_es_e |
épouse | esposa | epuz | pessoas | f | cr_es_e |
état | estado | eta | administracao | m | cr_es_e |
hôpital | hospital | ɔpital | saude | m | cr_circ_s |
fête | festa | fɛt | cotidiano | f | cr_circ_s |
goût | gosto, sabor | ɡu | compras | m | cr_circ_s |
coût | custo | ku | banco | m | cr_circ_s |
forêt | floresta | fɔʁɛ | lugares | f | cr_circ_s |
intérêt | interesse; juros | ɛ̃teʁɛ | banco | m | cr_circ_s |
vêtements | roupas | vɛtmɑ̃ | creche | mpl | cr_circ_s |
jaune | amarelo | ʒon | descricao | | | Jaune soa "jôn", com O fechado. Jeune (jovem) tem o som "œ".
vin | vinho | vɛ̃ | compras | m | | Vin → vinho: nasal aberto, quase "vẽ".
vent | vento | vɑ̃ | cotidiano | m | | Vent → vento: nasal "vã", boca bem aberta.
vont | (eles) vão | vɔ̃ | verbos | | | Ils vont = eles vão: nasal "võ", lábios arredondados.
roue | roda | ʁu | transporte | f | | Roue → roda: é o nosso "u" normal.
dessus | em cima | dəsy | lugares | | | Dessus = em cima: "u" com bico (língua no "i").
dessous | embaixo | dəsu | lugares | | | Dessous = embaixo: "u" normal do português.
vu | visto | vy | verbos | | | Vu = visto (déjà vu!).
poisson | peixe | pwasɔ̃ | compras | m | | SS = som de S: poisson → "piscicultura" (peixe).
poison | veneno | pwazɔ̃ | cotidiano | m | | Um S entre vogais = Z: poison → "poção" venenosa.
dessert | sobremesa | desɛʁ | compras | m | | SS = S: dessert, a sobremesa.
désert | deserto | dezɛʁ | lugares | m | | S entre vogais = Z: désert, o deserto.
cheveux | cabelo | ʃəvø | saude | mpl | | Soa "xevê": os cabelos.
chevaux | cavalos | ʃəvo | cotidiano | mpl | | Soa "xevô": cheval, chevaux = cavalo(s).
peur | medo | pœʁ | sentimentos | f | | Peur → "pavor": medo.
crèche | creche | kʁɛʃ | creche | f | |
couche | fralda | kuʃ | creche | f | | Couche = camada: a fralda é a "camada" do bebê.
biberon | mamadeira | bibʁɔ̃ | creche | m | | Bi-be-ron: o bebê bebe na mamadeira.
sieste | soneca | sjɛst | creche | f | | Sieste → "sesta": a soneca depois do almoço.
doudou | naninha, bichinho de pelúcia | dudu | creche | m | | O "dudu" do bebê: a naninha que ele não larga.
goûter | lanche da tarde | ɡute | creche | m | | Goûter = provar ("gosto"): o lanche da tarde.
jouet | brinquedo | ʒwɛ | creche | m | | Jouet ← jouer (brincar): brinquedo.
éducatrice | educadora | edykatʁis | creche | f | |
fièvre | febre | fjɛvʁ | saude | f | |
banque | banco (instituição) | bɑ̃k | banco | f | | Feminino em francês: LA banque.
compte | conta (bancária) | kɔ̃t | banco | m | | Compte ← compter (contar): a conta.
carte | cartão | kaʁt | banco | f | | Carte bancaire = cartão do banco.
virement | transferência | viʁmɑ̃ | banco | m | | Virement ← virer (virar): o dinheiro "vira" de conta.
crédit | crédito | kʁedi | banco | m | |
frais | taxas, tarifas | fʁɛ | banco | mpl | | Frais bancaires = tarifas bancárias. (Frais também = fresco.)
code | senha (PIN), código | kɔd | banco | m | |
clé | chave | kle | casa | f | | Clé → "clave" (chave musical).
distributeur | caixa eletrônico | distʁibytœʁ | banco | m | | O "distribuidor" de notas: caixa eletrônico.
guichet | guichê | ɡiʃɛ | administracao | m | |
entretien | entrevista (de emprego) | ɑ̃tʁətjɛ̃ | trabalho | m | | Entretien d'embauche = entrevista de emprego.
poste | vaga, cargo | pɔst | trabalho | m | | Le poste = o posto, o cargo. (La poste = o correio.)
diplôme | diploma | diplom | trabalho | m | |
équipe | equipe | ekip | trabalho | f | |
entreprise | empresa | ɑ̃tʁəpʁiz | trabalho | f | | Entreprise → "empreendimento": empresa.
contrat | contrato | kɔ̃tʁa | trabalho | m | |
ingénieur | engenheiro | ɛ̃ʒenjœʁ | trabalho | m | |
motivé | motivado | mɔtive | trabalho | | |
français | francês | fʁɑ̃sɛ | trabalho | m | |
anglais | inglês | ɑ̃ɡlɛ | trabalho | m | |
allemand | alemão | almɑ̃ | trabalho | m | |
portugais | português | pɔʁtyɡɛ | trabalho | m | |
luxembourgeois | luxemburguês | lyksɑ̃buʁʒwa | trabalho | m | |
gorge | garganta | ɡɔʁʒ | saude | f | | Gorge → "gorjeio", o canto que sai da garganta.
ventre | barriga | vɑ̃tʁ | saude | m | | Ventre → "ventre": barriga.
dos | costas | do | saude | m | | Dos → "dorso": costas. O S é mudo.
bras | braço | bʁa | saude | m | | Soa "brá": o S é mudo.
jambe | perna | ʒɑ̃b | saude | f | | Jambe → "jambon" (presunto, a perna do porco).
ordonnance | receita médica | ɔʁdɔnɑ̃s | saude | f | | A "ordem" do médico: a receita.
médicament | remédio | medikamɑ̃ | saude | m | |
douleur | dor | dulœʁ | saude | f | | Douleur → "dolorido".
toux | tosse | tu | saude | f | |
lait | leite | lɛ | compras | m | |
fromage | queijo | fʁɔmaʒ | compras | m | | Fromage → "forma": o queijo era feito em formas.
poulet | frango | pulɛ | compras | m | | Poulet → "pollo" (espanhol): frango.
viande | carne | vjɑ̃d | compras | f | | Viande → "vianda" (comida).
légumes | legumes | leɡym | compras | mpl | |
fruit | fruta | fʁɥi | compras | m | |
pomme | maçã | pɔm | compras | f | | Pomme → "pomar": maçã. Pomme de terre = batata.
caisse | caixa (do mercado) | kɛs | compras | f | |
sac | sacola | sak | compras | m | |
prix | preço | pʁi | compras | m | | Prix → "preço" (e prêmio: Grand Prix).
kilo | quilo | kilo | compras | m | |
bouteille | garrafa | butɛj | compras | f | | Bouteille → "botelha": garrafa.
œuf | ovo | œf | compras | m | | O F é pronunciado: "éuf".
beurre | manteiga | bœʁ | compras | m | | Beurre → "butter": manteiga.
sortie | saída | sɔʁti | lugares | f | | Sortie ← sortir (sair): a saída.
boulangerie | padaria | bulɑ̃ʒʁi | compras | f | | Boulanger = padeiro; boulangerie = padaria.
commune | prefeitura (comuna) | kɔmyn | administracao | f | | Em Luxemburgo, é na commune que se faz o registro de residência.
document | documento | dɔkymɑ̃ | administracao | m | |
certificat | certificado | sɛʁtifika | administracao | m | |
passeport | passaporte | paspɔʁ | administracao | m | |
logement | moradia | lɔʒmɑ̃ | casa | m | | Logement → "alojamento": moradia.
loyer | aluguel | lwaje | casa | m | | Loyer → "locar": o aluguel.
remplir | preencher | ʁɑ̃pliʁ | administracao | | | Remplir → "repleto": encher, preencher.
pièce d'identité | documento de identidade | pjɛs didɑ̃tite | administracao | f | |
salle | sala | sal | lugares | f | |
salir | sujar | saliʁ | casa | | | Falso amigo: salir = SUJAR. "Sair" é sortir.
sale | sujo | sal | casa | | | Falso amigo: sale = SUJO. "Sala" é salle.
tirer | puxar; atirar | tiʁe | cotidiano | | | Falso amigo: na porta, "tirez" = PUXE.
pousser | empurrar | puse | cotidiano | | | Falso amigo: na porta, "poussez" = EMPURRE.
propre | limpo; próprio | pʁɔpʁ | casa | | | Depois do nome = limpo: une chambre propre. Antes = próprio.
casser | quebrar | kase | cotidiano | | | Falso amigo: casser = QUEBRAR. "Casar" é se marier.
embrasser | beijar | ɑ̃bʁase | pessoas | | | Falso amigo: embrasser = BEIJAR (não é abraçar).
prétendre | afirmar, alegar | pʁetɑ̃dʁ | cotidiano | | | Falso amigo: prétendre = AFIRMAR. "Pretender" é avoir l'intention.
facteur | carteiro | faktœʁ | cotidiano | m | | Falso amigo: le facteur = o CARTEIRO.
`;
