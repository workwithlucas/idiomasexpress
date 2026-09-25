// Vocabulário complementar (além das 800 mais frequentes), necessário para:
//  - ilustrar as regras de cognatos,
//  - formar os pares mínimos e os falsos cognatos,
//  - cobrir as cenas práticas da vida em Luxemburgo (creche/CSA, commune,
//    banco, entrevista, pediatra, supermercado, transporte, vizinhança).
// Recebem freq_rank a partir de 801, na ordem em que aparecem aqui
// (ordem de utilidade dentro do complemento, NÃO posição real no corpus).
// Mesmo formato de words-core.mjs.
export const EXTRA_WORDS = `
nation | nação | nasjɔ̃ | cotidiano | f | cr_cao_tion |
solution | solução | sɔlysjɔ̃ | trabalho | f | cr_cao_tion |
déclaration | declaração | deklaʁasjɔ̃ | administracao | f | cr_cao_tion |
attestation | atestado, declaração | atɛstasjɔ̃ | administracao | f | cr_cao_tion |
université | universidade | ynivɛʁsite | trabalho | f | cr_dade_te |
réalité | realidade | ʁealite | cotidiano | f | cr_dade_te |
possibilité | possibilidade | pɔsibilite | cotidiano | f | cr_dade_te |
délicieux | delicioso | delisjø | compras | | cr_oso_eux |
curieux | curioso | kyʁjø | descricao | | cr_oso_eux |
nerveux | nervoso | nɛʁvø | sentimentos | | cr_oso_eux |
généreux | generoso | ʒeneʁø | descricao | | cr_oso_eux |
courageux | corajoso | kuʁaʒø | descricao | | cr_oso_eux |
précieux | precioso | pʁesjø | descricao | | cr_oso_eux |
rapidement | rapidamente | ʁapidmɑ̃ | | | cr_mente_ment |
nécessaire | necessário | nesesɛʁ | descricao | | cr_ario_aire |
dictionnaire | dicionário | diksjɔnɛʁ | cotidiano | m | cr_ario_aire |
anniversaire | aniversário | anivɛʁsɛʁ | cotidiano | m | cr_ario_aire |
vocabulaire | vocabulário | vɔkabylɛʁ | cotidiano | m | cr_ario_aire |
horaire | horário | ɔʁɛʁ | trabalho | m | cr_ario_aire |
formulaire | formulário | fɔʁmylɛʁ | administracao | m | cr_ario_aire |
agréable | agradável | aɡʁeabl | descricao | | cr_vel_ble |
disponible | disponível | dispɔnibl | trabalho | | cr_vel_ble |
incroyable | incrível | ɛ̃kʁwajabl | descricao | | cr_vel_ble |
dentiste | dentista | dɑ̃tist | saude | m | cr_ista_iste |
touriste | turista | tuʁist | cotidiano | m | cr_ista_iste |
artiste | artista | aʁtist | cotidiano | m | cr_ista_iste |
journaliste | jornalista | ʒuʁnalist | trabalho | m | cr_ista_iste |
politique | política | pɔlitik | cotidiano | f | cr_ico_ique |
magnifique | magnífico | maɲifik | descricao | | cr_ico_ique |
fantastique | fantástico | fɑ̃tastik | descricao | | cr_ico_ique |
électrique | elétrico | elɛktʁik | casa | | cr_ico_ique |
économie | economia | ekɔnɔmi | banco | f | cr_ia_ie |
énergie | energia | enɛʁʒi | casa | f | cr_ia_ie |
photographie | fotografia | fɔtɔɡʁafi | cotidiano | f | cr_ia_ie |
catégorie | categoria | kateɡɔʁi | cotidiano | f | cr_ia_ie |
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
image | imagem | imaʒ | cotidiano | f | cr_agem_age |
garage | garagem | ɡaʁaʒ | casa | m | cr_agem_age |
organiser | organizar | ɔʁɡanize | trabalho | | cr_izar_iser |
utiliser | utilizar, usar | ytilize | verbos | | cr_izar_iser |
réaliser | realizar | ʁealize | trabalho | | cr_izar_iser |
finaliser | finalizar | finalize | trabalho | | cr_izar_iser |
signer | assinar | siɲe | administracao | | cr_ar_er |
retirer | sacar, retirar | ʁətiʁe | banco | | cr_ar_er |
déposer | depositar | depoze | banco | | cr_ar_er |
culture | cultura | kyltyʁ | cotidiano | f | cr_ura_ure |
aventure | aventura | avɑ̃tyʁ | cotidiano | f | cr_ura_ure |
température | temperatura | tɑ̃peʁatyʁ | saude | f | cr_ura_ure |
facture | fatura, conta | faktyʁ | banco | f | cr_ura_ure |
signature | assinatura | siɲatyʁ | administracao | f | cr_ura_ure |
peinture | pintura | pɛ̃tyʁ | casa | f | cr_ura_ure |
banquier | bancário, banqueiro | bɑ̃kje | banco | m | cr_eiro_ier |
infirmier | enfermeiro | ɛ̃fiʁmje | saude | m | cr_eiro_ier |
cuisinier | cozinheiro | kɥizinje | trabalho | m | cr_eiro_ier |
épouse | esposa | epuz | pessoas | f | cr_es_e |
état | estado | eta | administracao | m | cr_es_e |
vêtements | roupas | vɛtmɑ̃ | creche | mpl | cr_circ_s |
coût | custo | ku | banco | m | cr_circ_s |
forêt | floresta | fɔʁɛ | lugares | f | cr_circ_s |
intérêt | interesse; juros | ɛ̃teʁɛ | banco | m | cr_circ_s |
vent | vento | vɑ̃ | cotidiano | m | | Vem do latim ventus, como "vento". Soa "vã", nasal, boca bem aberta.
vont | (eles) vão | vɔ̃ | verbos | | | Ils vont = eles vão: nasal "võ", lábios arredondados.
roue | roda | ʁu | transporte | f | | Vem do latim rota, como "roda". O OU é o nosso "u" normal.
dessus | em cima | dəsy | lugares | | | Dessus = em cima: "u" com bico (língua no "i").
dessous | embaixo | dəsu | lugares | | | Dessous = embaixo: "u" normal do português.
vu | visto | vy | verbos | | | Vu = visto, como em déjà vu.
poison | veneno | pwazɔ̃ | cotidiano | m | | Vem do latim potionem, como "poção": veneno. S entre vogais soa Z.
dessert | sobremesa | desɛʁ | compras | m | | SS = S: dessert, a sobremesa.
désert | deserto | dezɛʁ | lugares | m | | S entre vogais = Z: désert, o deserto.
chevaux | cavalos | ʃəvo | cotidiano | mpl | | Soa "xevô": cheval, chevaux = cavalo(s).
crèche | creche | kʁɛʃ | creche | f | |
couche | fralda | kuʃ | creche | f | | Couche = camada: a fralda é a "camada" do bebê.
biberon | mamadeira | bibʁɔ̃ | creche | m | | Bi-be-ron: o bebê bebe na mamadeira.
sieste | soneca | sjɛst | creche | f | | A "sesta" da soneca depois do almoço, a hora sexta dos romanos.
doudou | naninha, bichinho de pelúcia | dudu | creche | m | | O "dudu" do bebê: a naninha que ele não larga.
goûter | lanche da tarde | ɡute | creche | m | | Goûter = provar ("gosto"): o lanche da tarde.
jouet | brinquedo | ʒwɛ | creche | m | | Vem de jouer (brincar): brinquedo.
éducatrice | educadora | edykatʁis | creche | f | |
fièvre | febre | fjɛvʁ | saude | f | |
virement | transferência | viʁmɑ̃ | banco | m | | Vem de virer (virar): o dinheiro vira de conta.
crédit | crédito | kʁedi | banco | m | |
frais | taxas, tarifas | fʁɛ | banco | mpl | | Frais bancaires = tarifas bancárias. (Frais também = fresco.)
code | senha (PIN), código | kɔd | banco | m | |
distributeur | caixa eletrônico | distʁibytœʁ | banco | m | | O "distribuidor" de notas: caixa eletrônico.
guichet | guichê | ɡiʃɛ | administracao | m | |
entretien | entrevista (de emprego) | ɑ̃tʁətjɛ̃ | trabalho | m | | Entretien d'embauche = entrevista de emprego.
poste | vaga, cargo | pɔst | trabalho | m | | Le poste = o posto, o cargo. (La poste = o correio.)
diplôme | diploma | diplom | trabalho | m | |
équipe | equipe | ekip | trabalho | f | |
entreprise | empresa | ɑ̃tʁəpʁiz | trabalho | f | | Vem de entreprendre, como "empreender": empresa.
contrat | contrato | kɔ̃tʁa | trabalho | m | |
ingénieur | engenheiro | ɛ̃ʒenjœʁ | trabalho | m | |
motivé | motivado | mɔtive | trabalho | | |
portugais | português | pɔʁtyɡɛ | trabalho | m | cr_es_ais |
luxembourgeois | luxemburguês | lyksɑ̃buʁʒwa | trabalho | m | |
gorge | garganta | ɡɔʁʒ | saude | f | | Da mesma raiz de "gorja" e "gorjeio", o canto que sai da garganta.
ventre | barriga | vɑ̃tʁ | saude | m | | Igual ao nosso "ventre": barriga. J'ai mal au ventre = estou com dor de barriga.
dos | costas | do | saude | m | | Vem do latim dorsum, como "dorso": costas. O S é mudo.
jambe | perna | ʒɑ̃b | saude | f | | "Jambon" (presunto) vem daqui: a perna do porco.
ordonnance | receita médica | ɔʁdɔnɑ̃s | saude | f | | A "ordem" do médico: a receita.
médicament | remédio | medikamɑ̃ | saude | m | |
douleur | dor | dulœʁ | saude | f | | Vem do latim dolorem, como "dor" e "dolorido".
toux | tosse | tu | saude | f | |
lait | leite | lɛ | compras | m | |
fromage | queijo | fʁɔmaʒ | compras | m | | Vem de "formage": o queijo era feito em forma.
poulet | frango | pulɛ | compras | m | | Vem do latim pullus, o mesmo do espanhol "pollo": frango.
viande | carne | vjɑ̃d | compras | f | | Da mesma origem de "vianda", comida no português antigo: carne.
légumes | legumes | leɡym | compras | mpl | |
fruit | fruta | fʁɥi | compras | m | |
pomme | maçã | pɔm | compras | f | | Vem do latim pomum, a raiz de "pomar": maçã. Pomme de terre = batata.
caisse | caixa (do mercado) | kɛs | compras | f | |
kilo | quilo | kilo | compras | m | |
bouteille | garrafa | butɛj | compras | f | | Da mesma origem de "botelha" e do inglês "bottle": garrafa.
œuf | ovo | œf | compras | m | | O F é pronunciado: "éuf".
beurre | manteiga | bœʁ | compras | m | | Vem do latim butyrum, como o inglês "butter": manteiga.
sortie | saída | sɔʁti | lugares | f | | Vem de sortir (sair): a saída.
boulangerie | padaria | bulɑ̃ʒʁi | compras | f | | Boulanger = padeiro; boulangerie = padaria.
commune | prefeitura (comuna) | kɔmyn | administracao | f | | Em Luxemburgo, é na commune que se faz o registro de residência.
certificat | certificado | sɛʁtifika | administracao | m | |
passeport | passaporte | paspɔʁ | administracao | m | |
logement | moradia | lɔʒmɑ̃ | casa | m | | Vem de loger, o mesmo de "alojar": moradia.
loyer | aluguel | lwaje | casa | m | | Vem do latim locarium, a raiz de "locar": o aluguel.
remplir | preencher | ʁɑ̃pliʁ | administracao | | | Da mesma raiz de "repleto": encher, preencher.
pièce d'identité | documento de identidade | pjɛs didɑ̃tite | administracao | f | |
salle | sala | sal | lugares | f | |
salir | sujar | saliʁ | casa | | | Salir é sujar. Sair é sortir.
sale | sujo | sal | casa | | | Sale é sujo. Sala é salle.
tirer | puxar; atirar | tiʁe | cotidiano | | | Na porta, "tirez" quer dizer puxe.
pousser | empurrar | puse | cotidiano | | | Na porta, "poussez" quer dizer empurre.
casser | quebrar | kase | cotidiano | | | Casser é quebrar. Casar é se marier.
embrasser | beijar | ɑ̃bʁase | pessoas | | | Embrasser é beijar, não abraçar.
prétendre | afirmar, alegar | pʁetɑ̃dʁ | cotidiano | | | Prétendre é afirmar. Pretender é avoir l'intention.
facteur | carteiro | faktœʁ | cotidiano | m | | Le facteur é o carteiro.
optimiste | otimista | ɔptimist | sentimentos | | cr_ista_iste |
moderniser | modernizar | mɔdɛʁnize | trabalho | | cr_izar_iser |
appartement | apartamento | apaʁtəmɑ̃ | casa | m | | Quase igual a "apartamento", mas com dois P.
occupé | ocupado | ɔkype | descricao | | | Quase igual a "ocupado", com o C dobrado.
produire | produzir | pʁɔdɥiʁ | trabalho | | cr_uzir_uire |
traduire | traduzir | tʁadɥiʁ | trabalho | | cr_uzir_uire |
réduire | reduzir | ʁedɥiʁ | verbos | | cr_uzir_uire |
s'inscrire | inscrever-se, matricular-se | sɛ̃skʁiʁ | administracao | | | Vem do latim inscribere, como "inscrever": matricular-se na creche, na escola, na commune.
guérir | sarar, curar | ɡeʁiʁ | saude | | |
protéger | proteger | pʁɔteʒe | verbos | | |
corriger | corrigir | kɔʁiʒe | verbos | | |
cacher | esconder | kaʃe | verbos | | | Cache-cache = esconde-esconde.
fumer | fumar | fyme | verbos | | cr_ar_er |
peser | pesar | pəze | compras | | cr_ar_er |
surprendre | surpreender | syʁpʁɑ̃dʁ | verbos | | |
disparaître | desaparecer | dispaʁɛtʁ | verbos | | |
accueillir | acolher, receber | akœjiʁ | verbos | | | O "ueil" soa "ëi": "akëiir".
tenter | tentar | tɑ̃te | verbos | | cr_ar_er |
emprunter | pegar emprestado | ɑ̃pʁœ̃te | banco | | |
prêter | emprestar | pʁete | banco | | | Prêt = empréstimo (e também "pronto").
dépenser | gastar | depɑ̃se | banco | | | Vem do latim dispensare, a raiz de "despesa": gastar.
garer | estacionar | ɡaʁe | transporte | | | Garer la voiture = estacionar o carro (na "garagem").
traverser | atravessar | tʁavɛʁse | transporte | | |
se reposer | descansar | sə ʁəpoze | saude | | | Vem do latim repausare, como "repousar": descansar.
s'habiller | vestir-se | sabije | casa | | | Habit = roupa.
nager | nadar | naʒe | verbos | | |
danser | dançar | dɑ̃se | verbos | | |
cuisiner | cozinhar | kɥizine | casa | | |
se marier | casar-se | sə maʁje | pessoas | | |
appartenir | pertencer | apaʁtəniʁ | verbos | | |
attraper | pegar, apanhar | atʁape | verbos | | | "Armadilha" = trappe: attraper = pegar.
escalier | escada | ɛskalje | casa | m | |
ascenseur | elevador | asɑ̃sœʁ | casa | m | | O "ascensor": elevador.
assiette | prato | asjɛt | casa | f | |
télévision | televisão | televizjɔ̃ | casa | f | cr_sao_sion |
système | sistema | sistɛm | | m | cr_ema_eme |
salade | salada | salad | compras | f | cr_ada_ade |
mémoire | memória | memwaʁ | | f | cr_orio_oire |
compagnie | companhia | kɔ̃paɲi | trabalho | f | cr_nh_gn |
feuille | folha | fœj | | f | | Vem do latim folia, como "folha"; o LH vira ILL.
porte-monnaie | carteira (de moedas) | pɔʁtmɔnɛ | compras | m | | Porta-moeda.
monnaie | trocado; moeda | mɔnɛ | compras | f | | Vous avez de la monnaie? = tem trocado?
bouton | botão | butɔ̃ | | m | |
bruit | barulho | bʁɥi | casa | m | | O T é mudo: "brüí".
poubelle | lixeira, lixo | pubɛl | casa | f | |
cheval | cavalo | ʃəval | | m | | Plural: chevaux.
oiseau | pássaro | wazo | | m | | Tem as 5 vogais e nenhuma soa como se escreve: "uazô".
animal | animal | animal | | m | |
gâteau | bolo | ɡato | compras | m | | O circunflexo esconde um S: gasteau.
chocolat | chocolate | ʃɔkɔla | compras | m | |
glace | sorvete; gelo; espelho | ɡlas | compras | f | | Une glace au chocolat = um sorvete de chocolate.
orange | laranja | ɔʁɑ̃ʒ | compras | f | |
tomate | tomate | tɔmat | compras | f | |
pomme de terre | batata | pɔm də tɛʁ | compras | f | | "Maçã da terra": batata.
riz | arroz | ʁi | compras | m | | O Z é mudo: "rí".
pâtes | macarrão, massa | pɑt | compras | fpl | | A "pasta": massa.
huile | óleo; azeite | ɥil | compras | f | | Huile d'olive = azeite.
discussion | discussão | diskysjɔ̃ | trabalho | f | cr_sao_sion |
version | versão | vɛʁsjɔ̃ | cotidiano | f | cr_sao_sion |
profession | profissão | pʁɔfesjɔ̃ | trabalho | f | cr_sao_sion |
mission | missão | misjɔ̃ | trabalho | f | cr_sao_sion |
piscine | piscina | pisin | lugares | f | cr_ina_ine |
vitamine | vitamina | vitamin | saude | f | cr_ina_ine |
cantine | cantina, refeitório | kɑ̃tin | creche | f | cr_ina_ine |
discipline | disciplina | disiplin | creche | f | cr_ina_ine |
margarine | margarina | maʁɡaʁin | compras | f | cr_ina_ine |
routine | rotina | ʁutin | creche | f | cr_ina_ine |
tristesse | tristeza | tʁistɛs | sentimentos | f | cr_eza_esse |
finesse | fineza, delicadeza | finɛs | descricao | f | cr_eza_esse |
promesse | promessa | pʁɔmɛs | cotidiano | f | cr_eza_esse |
richesse | riqueza | ʁiʃɛs | banco | f | cr_eza_esse |
gentillesse | gentileza | ʒɑ̃tijɛs | sentimentos | f | cr_eza_esse |
délicatesse | delicadeza | delikatɛs | sentimentos | f | cr_eza_esse |
japonais | japonês | ʒapɔnɛ | pessoas | | cr_es_ais |
polonais | polonês | pɔlɔnɛ | pessoas | | cr_es_ais |
irlandais | irlandês | iʁlɑ̃dɛ | pessoas | | cr_es_ais |
libanais | libanês | libanɛ | pessoas | | cr_es_ais |
africain | africano | afʁikɛ̃ | pessoas | | cr_ano_ain |
mexicain | mexicano | mɛksikɛ̃ | pessoas | | cr_ano_ain |
romain | romano | ʁɔmɛ̃ | pessoas | | cr_ano_ain |
urbain | urbano | yʁbɛ̃ | lugares | | cr_ano_ain |
ballon | balão; bola | balɔ̃ | creche | m | cr_ao_on |
savon | sabão, sabonete | savɔ̃ | casa | m | cr_ao_on |
limonade | limonada | limɔnad | compras | f | cr_ada_ade |
camarade | camarada, colega | kamaʁad | pessoas | | cr_ada_ade |
marmelade | marmelada, geleia | maʁməlad | compras | f | cr_ada_ade |
pommade | pomada | pɔmad | saude | f | cr_ada_ade |
exercice | exercício | ɛɡzɛʁsis | saude | m | cr_icio_ice |
bénéfice | benefício; lucro | benefis | banco | m | cr_icio_ice |
sacrifice | sacrifício | sakʁifis | sentimentos | m | cr_icio_ice |
thème | tema | tɛm | cotidiano | m | cr_ema_eme |
poème | poema | pɔɛm | cotidiano | m | cr_ema_eme |
emblème | emblema | ɑ̃blɛm | cotidiano | m | cr_ema_eme |
théorème | teorema | teɔʁɛm | cotidiano | m | cr_ema_eme |
victoire | vitória | viktwaʁ | cotidiano | f | cr_orio_oire |
gloire | glória | ɡlwaʁ | cotidiano | f | cr_orio_oire |
laboratoire | laboratório | labɔʁatwaʁ | saude | m | cr_orio_oire |
obligatoire | obrigatório | ɔbliɡatwaʁ | administracao | | cr_orio_oire |
introduire | introduzir | ɛ̃tʁɔdɥiʁ | verbos | | cr_uzir_uire |
médaille | medalha | medaj | cotidiano | f | cr_lh_ill |
bataille | batalha | bataj | cotidiano | f | cr_lh_ill |
abeille | abelha | abɛj | cotidiano | f | cr_lh_ill |
conseil | conselho | kɔ̃sɛj | trabalho | m | cr_lh_ill |
champagne | champanhe | ʃɑ̃paɲ | compras | m | cr_nh_gn |
vigne | vinha, videira | viɲ | lugares | f | cr_nh_gn |
organisme | organismo | ɔʁɡanism | saude | m | cr_ismo_isme |
capitalisme | capitalismo | kapitalism | banco | m | cr_ismo_isme |
racisme | racismo | ʁasism | cotidiano | m | cr_ismo_isme |
tourisme | turismo | tuʁism | cotidiano | m | cr_ismo_isme |
journalisme | jornalismo | ʒuʁnalism | trabalho | m | cr_ismo_isme |
optimisme | otimismo | ɔptimism | sentimentos | m | cr_ismo_isme |
omelette | omelete | ɔmlɛt | compras | f | cr_eta_ette |
raquette | raquete | ʁakɛt | cotidiano | f | cr_eta_ette |
cassette | cassete, fita | kasɛt | cotidiano | f | cr_eta_ette |
étiquette | etiqueta | etikɛt | compras | f | cr_eta_ette |
bicyclette | bicicleta | bisiklɛt | transporte | f | cr_eta_ette |
chant | canto | ʃɑ̃ | cotidiano | m | | Vem do latim cantus, como "canto". Soa "xã": o T é mudo.
bonne | boa | bɔn | descricao | | | Bon soa "bõ" (nasal); bonne soa "bón", com N de verdade.
fine | fina | fin | descricao | | | Fin soa "fẽ"; fine soa "fín".
voisine | vizinha | vwazin | casa | f | | Voisin soa "vuazẽ"; voisine soa "vuazín".
pleine | cheia | plɛn | descricao | | | Plein soa "plẽ"; pleine soa "plén".
blond | loiro | blɔ̃ | descricao | | | "Blonde" é a loira. Blond soa "blõ".
petite | pequena | pətit | descricao | | | Petit: "petí" (T mudo). Petite: "petít" (T soa).
grande | grande (feminino) | ɡʁɑ̃d | descricao | | | Grand: "grã". Grande: "grãd".
verte | verde (feminino) | vɛʁt | descricao | | | Vert: "vér". Verte: "vért".
grise | cinza (feminino) | ɡʁiz | descricao | | | Gris: "grí". Grise: "gríz".
chaude | quente (feminino) | ʃod | descricao | | | Chaud: "xô". Chaude: "xôd".
toute | toda | tut | | | | Tout: "tu". Toute: "tut".
maison relais | maison relais (acolhimento fora do horário escolar) | mɛzɔ̃ ʁəlɛ | creche | f | | "Casa de revezamento": onde a criança fica antes e depois da escola.
chèque-service | chèque-service (CSA, auxílio do governo para a creche) | ʃɛk sɛʁvis | creche | m | | O CSA (chèque-service accueil) paga parte da creche e da maison relais.
inscription | inscrição, matrícula | ɛ̃skʁipsjɔ̃ | creche | f | cr_cao_tion |
activité | atividade | aktivite | creche | f | cr_dade_te |
absent | ausente | apsɑ̃ | creche | | | Il est absent aujourd'hui = ele faltou hoje.
arrivée | chegada | aʁive | administracao | f | | Déclaration d'arrivée = o registro de chegada na commune.
matricule | número de identificação (matricule) | matʁikyl | administracao | m | | O número nacional de 13 dígitos, usado na saúde, no banco e no trabalho.
copie | cópia | kɔpi | administracao | f | cr_ia_ie |
bail | contrato de aluguel | baj | casa | m | | O "ai" com L soa "ai": "bái".
propriétaire | proprietário, dono | pʁɔpʁijetɛʁ | casa | | cr_ario_aire |
locataire | inquilino | lɔkatɛʁ | casa | | | Quem "loca" (aluga): o inquilino.
nationalité | nacionalidade | nasjɔnalite | administracao | f | cr_dade_te |
demande | pedido, solicitação | dəmɑ̃d | administracao | f | | Demande é pedido, sem briga.
naissance | nascimento | nɛsɑ̃s | administracao | f | | Date de naissance = data de nascimento.
délai | prazo | delɛ | administracao | m | | Délai é prazo, não atraso.
amende | multa | amɑ̃d | administracao | f | | Emendar o erro: pagar a multa.
domiciliation | débito automático | dɔmisiljasjɔ̃ | banco | f | | A fatura fica "domiciliada" no seu banco e é paga sozinha todo mês.
ordre permanent | transferência programada, ordem permanente | ɔʁdʁ pɛʁmanɑ̃ | banco | m | | Uma "ordem permanente": o aluguel sai todo mês sozinho.
communication | referência (do pagamento); comunicação | kɔmynikasjɔ̃ | banco | f | cr_cao_tion |
solde | saldo | sɔld | banco | m | | Saldo. No plural, soldes = liquidação.
relevé | extrato | ʁəlve | banco | m | | Relevé de compte = extrato bancário.
retrait | saque | ʁətʁɛ | banco | m | | Vem de retirer: retirar dinheiro.
dépôt | depósito | depo | banco | m | | O circunflexo esconde um S: depost, como "depósito".
montant | valor, quantia | mɔ̃tɑ̃ | banco | m | | O "montante".
taux | taxa (percentual) | to | banco | m | | Taux d'intérêt = taxa de juros. X mudo: "tô".
épargne | poupança | epaʁɲ | banco | f | | Compte épargne = conta poupança.
référence | referência | ʁefeʁɑ̃s | banco | f | cr_ancia_ance |
cotisation | contribuição | kɔtizasjɔ̃ | banco | f | | Cotisations sociales = contribuições para a previdência.
CV | currículo | se ve | trabalho | m | | Diz-se "cê-vê", as letras.
candidature | candidatura | kɑ̃didatyʁ | trabalho | f | cr_ura_ure |
stage | estágio | staʒ | trabalho | m | | Faire un stage = fazer estágio.
télétravail | trabalho remoto | teletʁavaj | trabalho | m | | Télé (à distância) + travail.
formation | formação, treinamento | fɔʁmasjɔ̃ | trabalho | f | cr_cao_tion |
CDI | contrato por tempo indeterminado | se de i | trabalho | m | | Contrat à durée indéterminée: o contrato "efetivo".
CDD | contrato por tempo determinado | se de de | trabalho | m | | Contrat à durée déterminée: temporário.
comptable | contador | kɔ̃tabl | trabalho | | | Compter (contar) + -able: quem faz as contas. O P é mudo.
vendeur | vendedor | vɑ̃dœʁ | trabalho | m | |
informatique | informática | ɛ̃fɔʁmatik | trabalho | f | cr_ico_ique |
comptabilité | contabilidade | kɔ̃tabilite | trabalho | f | cr_dade_te |
pédiatre | pediatra | pedjatʁ | saude | | |
vaccin | vacina | vaksɛ̃ | saude | m | | Os dois C soam diferente: "vak-sẽ".
allergie | alergia | alɛʁʒi | saude | f | cr_ia_ie |
sirop | xarope | siʁo | saude | m | | O P é mudo: "sirô".
diarrhée | diarreia | djaʁe | saude | f | |
rhume | resfriado | ʁym | saude | m | | O H é mudo: "rüm".
antibiotique | antibiótico | ɑ̃tibjɔtik | saude | m | cr_ico_ique |
comprimé | comprimido | kɔ̃pʁime | saude | m | |
contrôle | controle; consulta de rotina | kɔ̃tʁol | saude | m | |
remboursement | reembolso | ʁɑ̃buʁsəmɑ̃ | saude | m | | A CNS (caixa de saúde) reembolsa parte da consulta.
poids | peso | pwa | saude | m | | Só "puá": D e S mudos.
taille | altura; tamanho | taj | saude | f | | Quelle taille? = que tamanho? (roupa)
promotion | promoção | pʁɔmɔsjɔ̃ | compras | f | cr_cao_tion |
rayon | seção, corredor (loja) | ʁɛjɔ̃ | compras | m | | Le rayon fruits = a seção de frutas.
caddie | carrinho (de compras) | kadi | compras | m | |
consigne | depósito (de garrafa) | kɔ̃siɲ | compras | f | | Garrafas com consigne voltam ao mercado e você recebe o valor de volta.
sachet | saquinho | saʃɛ | compras | m | | Diminutivo de sac.
yaourt | iogurte | jauʁt | compras | m | |
farine | farinha | faʁin | compras | f | |
jambon | presunto | ʒɑ̃bɔ̃ | compras | m | | Soa "jãbõ": o "jamón" dos espanhóis.
paquet | pacote | pakɛ | compras | m | |
tram | bonde (tram) | tʁam | transporte | m | | O "tram" de Luxemburgo: bonde moderno.
quai | plataforma | ke | transporte | m | | Soa "kê": o cais da estação.
correspondance | conexão, baldeação | kɔʁɛspɔ̃dɑ̃s | transporte | f | cr_ancia_ance |
direction | direção, sentido | diʁɛksjɔ̃ | transporte | f | cr_cao_tion |
gratuit | grátis, gratuito | ɡʁatɥi | transporte | | | O transporte público em Luxemburgo é gratuit (fora a 1ª classe).
parking | estacionamento | paʁkiŋ | transporte | m | |
station | estação | stasjɔ̃ | transporte | f | cr_cao_tion |
cave | porão | kav | casa | f | | Cave é porão (e adega).
boîte aux lettres | caixa de correio | bwat o lɛtʁ | casa | f | | "Caixa às cartas".
syndic | administradora do condomínio | sɛ̃dik | casa | m | | O "síndico" do prédio (geralmente uma empresa).
charges | taxas (de condomínio) | ʃaʁʒ | casa | fpl | | Loyer + charges = aluguel + condomínio.
sonnette | campainha | sɔnɛt | casa | f | | Vem de sonner (tocar).
plastique | plástico | plastik | casa | m | cr_ico_ique |
carton | papelão | kaʁtɔ̃ | casa | m | |
déchets | lixo, resíduos | deʃɛ | casa | mpl | |
`;
