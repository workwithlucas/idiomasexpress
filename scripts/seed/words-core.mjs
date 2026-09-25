// As 300 palavras mais frequentes do francês falado, em ordem aproximada de
// frequência (curadoria baseada em listas de corpora de legendas/fala, como
// Lexique 3 e OpenSubtitles, agrupando formas flexionadas no lema quando isso
// é mais útil para o estudo — ex.: "suis/es/est" → "être").
//
// Formato de cada linha (colunas separadas por "|"):
//   fr | pt | ipa | tema | gênero | id da regra de cognato | gancho de memória
// Tema vazio = "essenciais". Gênero: m, f, mpl, fpl (só para substantivos).
// Gancho de memória só para palavras SEM regra de cognato (validado no build).
export const CORE_WORDS = `
de | de | də | | | |
je | eu | ʒə | | | | Soa "jê" bem curto. Antes de vogal vira j': j'ai = eu tenho.
être | ser, estar | ɛtʁ | verbos | | | Um verbo só para "ser" e "estar": je suis = eu sou / eu estou.
le | o (artigo) | lə | | | |
la | a (artigo) | la | | | |
les | os, as | le | | | |
pas | não (com ne) | pa | | | | "Ne… pas" abraça o verbo: je ne sais pas = não sei. Na fala, o "ne" some: "je sais pas".
vous | vocês; o senhor, a senhora | vu | | | | Tratamento formal: use com desconhecidos, no banco e na creche.
tu | você (informal) | ty | | | | Só com amigos, família e crianças. Lábios em bico, língua no "i".
que | que | kə | | | |
un | um | œ̃ | | | |
une | uma | yn | | | |
il | ele | il | | | |
et | e | e | | | | O T é mudo: soa exatamente como o nosso "e".
à | a, para, em | a | | | |
avoir | ter | avwaʁ | verbos | | | Parente do nosso "haver": j'ai = eu tenho (como em "eu hei de").
ne | não (partícula) | nə | | | | Metade do "não": anda em dupla com pas, plus, jamais ou rien.
ce | isso, este | sə | | | |
en | em; disso | ɑ̃ | | | |
on | a gente | ɔ̃ | | | | É o nosso "a gente": on y va? = a gente vai?
ça | isso | sa | | | | O "isso" do dia a dia: ça va? = tudo bem?
faire | fazer | fɛʁ | verbos | | | Vem do latim facere, como "fazer". Je fais = eu faço.
pour | para | puʁ | | | | Soa "pur". Pour moi = para mim.
dans | dentro de, em | dɑ̃ | | | | Dans la boîte = dentro da caixa.
qui | quem; que | ki | | | |
nous | nós | nu | | | | "Nós" sem o S e com U: nous.
mais | mas | mɛ | | | | Mais é "mas". Para dizer "mais", use plus.
avec | com | avɛk | | | | O C final soa: "avék". Un café avec du lait = um café com leite.
moi | eu, mim | mwa | | | | Soa "muá". C'est moi = sou eu.
aller | ir | ale | verbos | | | "Allez!" = vamos. Aller = ir.
mon | meu | mɔ̃ | | | |
ma | minha | ma | | | |
son | seu, dele/dela; som | sɔ̃ | | | |
sa | sua, dele/dela | sa | | | |
y | lá, nisso | i | | | | Aponta para um lugar: j'y vais = eu vou lá. Il y a = há, existe.
elle | ela | ɛl | | | | Soa "él", mas é ela. "Ele" é il.
ils | eles | il | | | |
me | me | mə | | | |
te | te | tə | | | |
se | se | sə | | | |
du | do, da (partitivo) | dy | | | |
des | uns, umas; dos, das | de | | | |
au | ao, no | o | | | |
sur | sobre, em cima de | syʁ | | | | Parece "sul", mas é "sobre": sur la table = sobre a mesa.
si | se; tão; sim (contradizendo) | si | | | |
tout | tudo, todo | tu | | | | Soa "tu": tu(do) sem o final.
plus | mais | ply | | | | O "+" da matemática: plus = mais. Ne… plus = não… mais.
non | não | nɔ̃ | | | |
oui | sim | wi | | | | Soa "uí". Oui ou non?
bien | bem | bjɛ̃ | | | | "Bem" com nariz: très bien = muito bem.
lui | ele; lhe | lɥi | | | |
toi | você (tônico) | twa | | | |
votre | seu, de vocês | vɔtʁ | | | |
ton | teu | tɔ̃ | | | |
cette | esta, essa | sɛt | | | |
par | por | paʁ | | | |
ou | ou | u | | | |
dire | dizer | diʁ | verbos | | | Vem do latim dicere, como "dizer". Je dis = eu digo.
pouvoir | poder | puvwaʁ | verbos | | | Poder com V: je peux = eu posso.
vouloir | querer | vulwaʁ | verbos | | | Da mesma raiz latina de "vontade" e "voluntário". Je veux = eu quero.
savoir | saber | savwaʁ | verbos | | | O B de "saber" virou V: je sais = eu sei.
voir | ver | vwaʁ | verbos | | | Vem do latim videre, como "ver". Au revoir = até a vista.
comme | como | kɔm | | | |
quoi | o quê | kwa | | | | Soa "cuá?": o "quê?" do susto.
ici | aqui | isi | lugares | | | "Aqui" sem o A e com som de S: "issi".
là | lá, ali | la | lugares | | |
rien | nada | ʁjɛ̃ | | | | De rien = de nada. Pense em "rir de nada".
venir | vir | vəniʁ | verbos | | |
où | onde | u | | | | Com acento, é "onde"; sem acento, ou é "ou".
pourquoi | por quê | puʁkwa | | | | Pour (para) + quoi (quê): "para quê?". É o nosso "por quê?".
parce que | porque | paʁskə | | | | "Por isso que": parce que = porque.
quand | quando | kɑ̃ | | | | "Quan(do)" cortado: quand?
comment | como | kɔmɑ̃ | | | | Comment ça va? = como vai? Nada a ver com "comentar".
alors | então | alɔʁ | | | | Vem de "à lors", naquela hora. Hoje é "então": alors, on y va?
très | muito | tʁɛ | | | | Soa "tré". Très bien = muito bem.
aussi | também | osi | | | | Soa "ossi": moi aussi = eu também.
bon | bom | bɔ̃ | descricao | | |
merci | obrigado(a) | mɛʁsi | cotidiano | | | Vem do latim mercedem, o mesmo de "mercê". Merci beaucoup = muito obrigado.
falloir | ser preciso (il faut) | falwaʁ | verbos | | | Il faut = é preciso: algo "faz falta".
devoir | dever | dəvwaʁ | verbos | | |
prendre | pegar, tomar | pʁɑ̃dʁ | verbos | | | Vem do latim prehendere, como "prender". Prendre le bus = pegar o ônibus.
parler | falar | paʁle | verbos | | | Parlamento vem de parler: o lugar onde se fala. Je parle = eu falo.
mettre | pôr, colocar | mɛtʁ | verbos | | | Vem do latim mittere, como "meter": pôr, colocar.
croire | acreditar, crer | kʁwaʁ | verbos | | | Vem do latim credere, como "crer". Je crois = eu acho.
passer | passar | pase | verbos | | cr_ar_er |
penser | pensar | pɑ̃se | verbos | | cr_ar_er |
maintenant | agora | mɛ̃tnɑ̃ | tempo | | | main (mão) + tenant (segurando): o que está na mão é agora.
juste | só, apenas; justo | ʒyst | | | |
chose | coisa | ʃoz | cotidiano | f | | Vem do latim causa, como "coisa". Soa "xôz".
quelque chose | alguma coisa | kɛlkə ʃoz | | | | quelque (algum) + chose (coisa).
aimer | gostar, amar | eme | verbos | | | Vem do latim amare, como "amar". J'aime = eu gosto, eu amo.
donner | dar | dɔne | verbos | | | Vem do latim donare, como "doar": dar.
trouver | encontrar, achar | tʁuve | verbos | | | Mesma raiz de "trovador", quem achava versos. Je trouve = eu acho.
temps | tempo (duração e clima) | tɑ̃ | tempo | m | | A mesma palavra para tempo e clima: quel temps! = que tempo.
jour | dia | ʒuʁ | tempo | m | | Vem do latim diurnum, a raiz de "jornada" e "jornal".
an | ano | ɑ̃ | tempo | m | |
homme | homem | ɔm | pessoas | m | |
femme | mulher; esposa | fam | pessoas | f | | Vem do latim femina, como "feminino". Soa "fam".
enfant | criança; filho(a) | ɑ̃fɑ̃ | creche | m | | Vem do latim infans, como "infantil".
fois | vez | fwa | tempo | f | | Soa "fuá": une fois = uma vez.
beaucoup | muito | boku | | | | Beau coup: literalmente "belo golpe". Merci beaucoup = muito obrigado.
peu | pouco | pø | | | | Soa quase "pô": un peu = um pouco.
trop | demais | tʁo | | | | Soa "trô". C'est trop cher = é caro demais.
encore | ainda; de novo | ɑ̃kɔʁ | | | | O "encore!" do show: de novo. Também quer dizer ainda.
déjà | já | deʒa | tempo | | | Déjà-vu = já visto.
jamais | nunca | ʒamɛ | | | | Igual ao nosso "jamais": nunca.
toujours | sempre; ainda | tuʒuʁ | tempo | | | De "tous jours", todos os dias: sempre.
peut-être | talvez | pøtɛtʁ | | | | Peut + être = pode ser: talvez.
vraiment | realmente | vʁɛmɑ̃ | | | | vrai (verdadeiro) + -ment: verdadeiramente.
avant | antes | avɑ̃ | tempo | | | Vem do latim abante, como "avante" e "vanguarda": antes, na frente.
après | depois | apʁɛ | tempo | | | Soa "aprê". Après le dîner = depois do jantar.
sans | sem | sɑ̃ | | | | Sans soa "sã": sem. Sans sucre = sem açúcar.
chez | na casa de | ʃe | casa | | | Chez moi = na minha casa. Chez le médecin = no médico.
entre | entre | ɑ̃tʁ | | | |
depuis | desde; há (tempo) | dəpɥi | tempo | | | de + puis (depois): desde.
pendant | durante | pɑ̃dɑ̃ | tempo | | | Vem de "pendente": enquanto algo está pendente, durante. Pendant le cours = durante a aula.
autre | outro | otʁ | | | |
même | mesmo | mɛm | | | | Moi-même = eu mesmo.
chaque | cada | ʃak | | | |
notre | nosso | nɔtʁ | | | |
leur | deles, delas | lœʁ | | | |
mes | meus, minhas | me | | | |
elles | elas | ɛl | | | |
personne | pessoa; ninguém | pɛʁsɔn | pessoas | f | | Sozinha vira "ninguém": personne n'est là = não tem ninguém.
quelqu'un | alguém | kɛlkœ̃ | pessoas | | | quelque (algum) + un (um) = alguém.
partir | ir embora, partir | paʁtiʁ | verbos | | |
comprendre | entender, compreender | kɔ̃pʁɑ̃dʁ | verbos | | |
connaître | conhecer | kɔnɛtʁ | verbos | | | Vem do latim cognoscere, como "conhecer". Je connais = eu conheço.
entendre | ouvir | ɑ̃tɑ̃dʁ | verbos | | | Entendre é ouvir. Entender é comprendre.
attendre | esperar | atɑ̃dʁ | verbos | | | Attendre é esperar. Atender é répondre ou servir.
arriver | chegar; acontecer | aʁive | verbos | | | Vem do latim arripare, chegar à margem, como "arribar": chegar.
demander | pedir, perguntar | dəmɑ̃de | verbos | | | Demander é pedir ou perguntar, não "demandar" na justiça.
rester | ficar | ʁɛste | verbos | | | Rester é ficar. Je reste ici = eu fico aqui.
sortir | sair | sɔʁtiʁ | verbos | | | Sortir é sair, nada de "sortear". La sortie = a saída.
regarder | olhar; assistir | ʁəɡaʁde | verbos | | | Re + garder (guardar): olhar com atenção.
appeler | chamar; ligar | aple | verbos | | | Vem do latim appellare, como "apelar": chamar. Je m'appelle = eu me chamo.
vivre | viver | vivʁ | verbos | | |
écouter | escutar | ekute | verbos | | cr_es_e |
chercher | procurar; buscar | ʃɛʁʃe | verbos | | | Vem do latim circare, andar em volta, como "cercar": procurar. Venir chercher = vir buscar.
jouer | jogar, brincar; tocar | ʒwe | verbos | | | Vem do latim jocari, parente de "jogo": jogar, brincar.
tomber | cair | tɔ̃be | verbos | | | Soa "tõbê". Il est tombé = ele caiu.
travailler | trabalhar | tʁavaje | trabalho | | | Mesma origem de "trabalhar"; o LH vira ILL. Je travaille = eu trabalho.
commencer | começar | kɔmɑ̃se | verbos | | |
finir | terminar | finiʁ | verbos | | | Vem do latim finire, como "fim" e "finalizar".
ouvrir | abrir | uvʁiʁ | verbos | | | Ouvrir é abrir. Abra a porta para ouvir quem bate.
fermer | fechar | fɛʁme | verbos | | | Vem do latim firmare, o mesmo de "firmar": fechar firme. Fermez la porte = feche a porta.
manger | comer | mɑ̃ʒe | verbos | | | Vem do latim manducare; "manjar" veio daqui. Je mange = eu como.
boire | beber | bwaʁ | verbos | | | "Beber" encolhido: je bois = eu bebo. Boisson = bebida.
dormir | dormir | dɔʁmiʁ | verbos | | |
écrire | escrever | ekʁiʁ | verbos | | cr_es_e |
lire | ler | liʁ | verbos | | | Vem do latim legere, o mesmo de "ler" e "legível". Je lis = eu leio.
payer | pagar | peje | banco | | | Vem do latim pacare, o mesmo de "pagar".
acheter | comprar | aʃte | compras | | | Soa "achtê". J'achète du pain = compro pão.
apprendre | aprender | apʁɑ̃dʁ | verbos | | |
perdre | perder | pɛʁdʁ | verbos | | |
tenir | segurar | təniʁ | verbos | | | Vem do latim tenere, a raiz de "tenaz": segurar firme.
sentir | sentir | sɑ̃tiʁ | verbos | | |
revenir | voltar | ʁəvniʁ | verbos | | | Re + venir (vir): vir de novo, voltar.
essayer | tentar; experimentar | eseje | verbos | | | Vem do latim exagiare, como "ensaiar": tentar.
aider | ajudar | ede | verbos | | | Vem do latim adjutare, como "ajudar". Je peux vous aider? = posso ajudar?
habiter | morar; habitar | abite | casa | | cr_ar_er |
changer | trocar, mudar | ʃɑ̃ʒe | verbos | | | Vem do latim cambiare, parente de "câmbio": trocar.
montrer | mostrar | mɔ̃tʁe | verbos | | cr_ar_er |
porter | levar; vestir | pɔʁte | verbos | | | Vem do latim portare, como "portar": levar consigo.
arrêter | parar | aʁete | verbos | | | Vem do latim arrestare, como "arrestar": fazer parar.
oublier | esquecer | ublije | verbos | | | Vem do latim oblitare, o mesmo de "olvidar" (esquecer).
monter | subir | mɔ̃te | verbos | | | Da mesma raiz de "montanha" e "montar": subir.
descendre | descer | desɑ̃dʁ | verbos | | |
entrer | entrar | ɑ̃tʁe | verbos | | cr_ar_er |
répondre | responder | ʁepɔ̃dʁ | verbos | | |
expliquer | explicar | ɛksplike | verbos | | cr_ar_er |
envoyer | enviar | ɑ̃vwaje | verbos | | |
recevoir | receber | ʁəsəvwaʁ | verbos | | |
marcher | andar; funcionar | maʁʃe | verbos | | | "Marchar" veio daqui. Ça marche? = funciona? combinado?
gagner | ganhar | ɡaɲe | trabalho | | | O GN soa como o nosso NH: "ganhê". Gagner = ganhar.
choisir | escolher | ʃwaziʁ | verbos | | | O inglês "choice" veio do francês daqui: escolher.
préférer | preferir | pʁefeʁe | verbos | | |
aujourd'hui | hoje | oʒuʁdɥi | tempo | | | au jour d'hui = no dia de hoje.
demain | amanhã | dəmɛ̃ | tempo | | | Vem do latim de mane, "de manhã": amanhã.
hier | ontem | jɛʁ | tempo | | | O H é mudo: "iér". Ontem já era.
heure | hora | œʁ | tempo | f | |
minute | minuto | minyt | tempo | f | |
semaine | semana | s(ə)mɛn | tempo | f | |
mois | mês | mwa | tempo | m | | Soa "muá": un mois = um mês.
année | ano (duração) | ane | tempo | f | |
matin | manhã | matɛ̃ | tempo | m | | Vem do latim matutinum, como "matinal": de manhã.
soir | noite (fim do dia) | swaʁ | tempo | m | | Vem do latim sero, tarde. "Soirée" (festa à noite) vem de soir.
nuit | noite | nɥi | tempo | f | | Bonne nuit = boa noite (na hora de dormir).
moment | momento | mɔmɑ̃ | tempo | m | |
tard | tarde (atrasado) | taʁ | tempo | | |
tôt | cedo | to | tempo | | | Soa "tô". Tôt le matin = cedo de manhã.
bientôt | em breve | bjɛ̃to | tempo | | | Bien + tôt = bem cedo: em breve. À bientôt = até logo.
souvent | frequentemente | suvɑ̃ | tempo | | | Soa "suvã": muitas vezes.
vie | vida | vi | cotidiano | f | |
monde | mundo; gente | mɔ̃d | cotidiano | m | | Tout le monde = todo mundo.
fils | filho | fis | pessoas | m | | O L é mudo: "fis". Não confunda com fille.
fille | filha; menina | fij | pessoas | f | | O "ill" soa "i": "fii". Não confunda com fils (filho).
père | pai | pɛʁ | pessoas | m | | Vem do latim pater, como "paterno".
mère | mãe | mɛʁ | pessoas | f | | Vem do latim mater, como "materno".
frère | irmão | fʁɛʁ | pessoas | m | | Vem do latim frater, como "frei" (irmão de ordem).
sœur | irmã | sœʁ | pessoas | f | | Vem do latim soror, como "sóror" (irmã de ordem).
mari | marido | maʁi | pessoas | m | | Mari = "mari(do)".
famille | família | famij | pessoas | f | |
ami | amigo | ami | pessoas | m | |
parents | pais | paʁɑ̃ | pessoas | mpl | | Parents são os pais (pai e mãe). Parentes são la famille.
gens | pessoas, gente | ʒɑ̃ | pessoas | mpl | | Gens = gente.
monsieur | senhor | məsjø | pessoas | m | | mon + sieur = meu senhor. Soa "messiê".
madame | senhora | madam | pessoas | f | |
bébé | bebê | bebe | creche | m | |
nom | nome | nɔ̃ | administracao | m | |
maison | casa | mɛzɔ̃ | casa | f | | Vem do latim mansionem, como "mansão": casa.
porte | porta | pɔʁt | casa | f | |
chambre | quarto | ʃɑ̃bʁ | casa | f | | Vem do latim camera, como "câmara": o quarto.
eau | água | o | cotidiano | f | | Três letras, um som só: "ô". De l'eau = água.
argent | dinheiro; prata | aʁʒɑ̃ | banco | m | | Argentina = terra da prata. Argent = dinheiro.
travail | trabalho | tʁavaj | trabalho | m | |
place | lugar; praça | plas | lugares | f | |
ville | cidade | vil | lugares | f | | Vem do latim villa, como "vila": cidade.
pays | país | pei | lugares | m | |
rue | rua | ʁy | lugares | f | |
école | escola | ekɔl | creche | f | cr_es_e |
voiture | carro | vwatyʁ | transporte | f | | Da mesma origem de "viatura": carro.
tête | cabeça | tɛt | saude | f | | O circunflexo esconde um S: teste, do latim testa, como "testa". Hoje é cabeça.
main | mão | mɛ̃ | saude | f | | Vem do latim manus, como "manual": mão.
corps | corpo | kɔʁ | saude | m | |
cœur | coração | kœʁ | saude | m | | Vem do latim cor, a raiz de "cordial": coração.
pied | pé | pje | saude | m | |
histoire | história | istwaʁ | cotidiano | f | cr_orio_oire |
problème | problema | pʁɔblɛm | cotidiano | m | cr_ema_eme |
question | pergunta, questão | kɛstjɔ̃ | cotidiano | f | cr_cao_tion |
idée | ideia | ide | cotidiano | f | |
raison | razão | ʁɛzɔ̃ | cotidiano | f | |
fin | fim | fɛ̃ | tempo | f | |
côté | lado | kote | lugares | m | | À côté = ao lado ("costado").
mot | palavra | mo | cotidiano | m | | O português "mote" veio daqui: palavra.
façon | jeito, maneira | fasɔ̃ | cotidiano | f | | Vem do latim factionem, como "feição": jeito.
train | trem | tʁɛ̃ | transporte | m | |
bus | ônibus | bys | transporte | m | |
gare | estação de trem | ɡaʁ | transporte | f | | A "garagem" dos trens: la gare.
café | café | kafe | compras | m | |
pain | pão | pɛ̃ | compras | m | | Vem do latim panem, como "pão" e "panificadora".
repas | refeição | ʁəpa | casa | m | | Da mesma origem de "repasto": refeição.
livre | livro | livʁ | cotidiano | m | |
téléphone | telefone | telefɔn | cotidiano | m | |
numéro | número | nymeʁo | administracao | m | |
adresse | endereço | adʁɛs | administracao | f | | O inglês "address" veio daqui: endereço.
rendez-vous | compromisso, consulta | ʁɑ̃devu | administracao | m | | O encontro marcado: no médico, no banco, na commune.
bureau | escritório; mesa | byʁo | trabalho | m | | "Burocracia" vem de bureau: escritório, e também a mesa de trabalho.
chef | chefe | ʃɛf | trabalho | m | |
docteur | doutor, médico | dɔktœʁ | saude | m | cr_or_eur |
médecin | médico | medsɛ̃ | saude | m | | Da mesma raiz de "medicina": médico.
grand | grande; alto | ɡʁɑ̃ | descricao | | |
petit | pequeno | pəti | descricao | | | Soa "petí": o T final é mudo. Mon petit = meu pequeno.
beau | bonito | bo | descricao | | | Soa "bô": "bô-nito".
nouveau | novo | nuvo | descricao | | | Art nouveau = arte nova.
vieux | velho | vjø | descricao | | | Soa "viê": velho.
jeune | jovem | ʒœn | pessoas | | | Da mesma raiz de "jovem" e "júnior". Cuidado: jaune é amarelo.
vrai | verdadeiro | vʁɛ | descricao | | | Vem do latim verus, a raiz de "veraz" e "verídico": verdadeiro.
seul | sozinho; único | sœl | descricao | | | Vem do latim solus, como "só" e "solo": sozinho.
dernier | último | dɛʁnje | descricao | | | Da mesma origem de "derradeiro": último.
premier | primeiro | pʁəmje | numeros | | cr_eiro_ier |
prêt | pronto | pʁɛ | descricao | | | O circunflexo esconde um S: prest, como "presto": pronto.
content | contente | kɔ̃tɑ̃ | sentimentos | | |
heureux | feliz | øʁø | sentimentos | | | Vem de "heur", sorte, no francês antigo: bonheur (boa sorte) é felicidade.
désolé | desculpe, sinto muito | dezɔle | sentimentos | | | Vem do latim desolatus, como "desolado": sinto muito.
fatigué | cansado | fatiɡe | sentimentos | | | Vem do latim fatigare, como "fadiga": cansado.
malade | doente | malad | saude | | | Quem está mal está malade.
facile | fácil | fasil | descricao | | |
difficile | difícil | difisil | descricao | | |
important | importante | ɛ̃pɔʁtɑ̃ | descricao | | |
possible | possível | pɔsibl | descricao | | cr_vel_ble |
cher | caro; querido | ʃɛʁ | compras | | | O "ch" veio do "ca": cher = caro. Chéri = querido.
chaud | quente | ʃo | cotidiano | | | Vem do latim calidus, como "cálido": quente.
froid | frio | fʁwa | cotidiano | | |
mal | mal; dor | mal | saude | | |
mieux | melhor (advérbio) | mjø | descricao | | | Soa "miê". Ça va mieux = está melhor.
meilleur | melhor (adjetivo) | mɛjœʁ | descricao | | | Vem do latim melior, como "melhor"; o LH vira ILL.
vite | rápido | vit | descricao | | | Soa "vit". Vite! = rápido.
ensemble | juntos | ɑ̃sɑ̃bl | | | | O "ensemble" musical: todos juntos.
presque | quase | pʁɛsk | | | | Près (perto) + que: quase.
d'accord | de acordo, ok | dakɔʁ | cotidiano | | | "De acordo", palavra por palavra: ok, combinado.
bonjour | bom dia, olá | bɔ̃ʒuʁ | cotidiano | | | bon (bom) + jour (dia).
bonsoir | boa noite (ao chegar) | bɔ̃swaʁ | cotidiano | | | bon + soir: boa noite ao chegar. Para dormir: bonne nuit.
salut | oi; tchau | saly | cotidiano | | | Vem do latim salus, a raiz de "saudação" e "saúde": oi, tchau.
au revoir | até logo | o ʁəvwaʁ | cotidiano | | | "Ao rever": até a próxima.
pardon | desculpe, perdão | paʁdɔ̃ | cotidiano | | |
s'il vous plaît | por favor | sil vu plɛ | cotidiano | | | "Se vos apraz", palavra por palavra: se lhe agrada, por favor.
excusez-moi | com licença; desculpe | ɛkskyze mwa | cotidiano | | |
deux | dois | dø | numeros | | | Soa "dê" com bico. Cuidado: des ("dê" aberto) = uns.
trois | três | tʁwa | numeros | | |
quatre | quatro | katʁ | numeros | | |
cinq | cinco | sɛ̃k | numeros | | |
six | seis | sis | numeros | | |
sept | sete | sɛt | numeros | | | O P é mudo: "sét".
huit | oito | ɥit | numeros | | |
neuf | nove; novo | nœf | numeros | | | Neuf é "nove" e também "novo": un vélo neuf = uma bicicleta nova.
dix | dez | dis | numeros | | |
vingt | vinte | vɛ̃ | numeros | | | Só se ouve o nasal "vẽ": todas as consoantes finais somem.
cent | cem | sɑ̃ | numeros | | |
mille | mil | mil | numeros | | |
`;
