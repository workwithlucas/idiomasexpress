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
faire | fazer | fɛʁ | verbos | | | Fazer sem o Z: fa(z)er → faire.
pour | para | puʁ | | | | Soa "pur": pur(a) → para.
dans | dentro de, em | dɑ̃ | | | | Dans la boîte = dentro da caixa.
qui | quem; que | ki | | | |
nous | nós | nu | | | | "Nós" sem o S e com U: nous.
mais | mas | mɛ | | | | Falso amigo! Mais = MAS. Para dizer "mais", use plus.
avec | com | avɛk | | | | Café avec lait = café com leite. O C final é pronunciado.
moi | eu, mim | mwa | | | | Soa "muá", como um beijo: c'est moi! = sou eu!
aller | ir | ale | verbos | | | "Allez!" = vamos! Aller = ir.
mon | meu | mɔ̃ | | | |
ma | minha | ma | | | |
son | seu, dele/dela; som | sɔ̃ | | | |
sa | sua, dele/dela | sa | | | |
y | lá, nisso | i | | | | Aponta para um lugar: j'y vais = eu vou lá. Il y a = há, existe.
elle | ela | ɛl | | | | Soa "él", mas é ELA. "Ele" é il.
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
oui | sim | wi | | | | Soa "uí" — um sim animado.
bien | bem | bjɛ̃ | | | | "Bem" com nariz: très bien = muito bem.
lui | ele; lhe | lɥi | | | |
toi | você (tônico) | twa | | | |
votre | seu, de vocês | vɔtʁ | | | |
ton | teu | tɔ̃ | | | |
cette | esta, essa | sɛt | | | |
par | por | paʁ | | | |
ou | ou | u | | | |
dire | dizer | diʁ | verbos | | | Dizer sem o "ze": di(ze)r → dire.
pouvoir | poder | puvwaʁ | verbos | | | Poder com V: je peux = eu posso.
vouloir | querer | vulwaʁ | verbos | | | Vouloir → "vontade, voluntário": je veux = eu quero.
savoir | saber | savwaʁ | verbos | | | O B de "saber" virou V: je sais = eu sei.
voir | ver | vwaʁ | verbos | | | Voir → ver. Au revoir = até rever.
comme | como | kɔm | | | |
quoi | o quê | kwa | | | | Soa "cuá?": o "quê?" do susto.
ici | aqui | isi | lugares | | | "Aqui" sem o A e com som de S: "issi".
là | lá, ali | la | lugares | | |
rien | nada | ʁjɛ̃ | | | | De rien = de nada. Pense em "rir de nada".
venir | vir | vəniʁ | verbos | | |
où | onde | u | | | | Soa "u": "u(nde)?" — onde?
pourquoi | por quê | puʁkwa | | | | pour (para) + quoi (quê) = para quê? → por quê?
parce que | porque | paʁskə | | | | "Por isso que": parce que = porque.
quand | quando | kɑ̃ | | | | "Quan(do)" cortado: quand?
comment | como | kɔmɑ̃ | | | | Comment ça va? = como vai? Nada a ver com "comentar".
alors | então | alɔʁ | | | | "À l'ora": naquela hora → então.
très | muito | tʁɛ | | | | Três vezes mais → muito: très bien.
aussi | também | osi | | | | Soa "ossi": moi aussi = eu também.
bon | bom | bɔ̃ | descricao | | |
merci | obrigado(a) | mɛʁsi | cotidiano | | | Merci → "mercê": grato pela sua mercê.
falloir | ser preciso (il faut) | falwaʁ | verbos | | | Il faut = é preciso — algo "faz falta".
devoir | dever | dəvwaʁ | verbos | | |
prendre | pegar, tomar | pʁɑ̃dʁ | verbos | | | Prendre → "prender": pegar. Prendre le bus = pegar o ônibus.
parler | falar | paʁle | verbos | | | Parler → "parlamento", onde todos falam.
mettre | pôr, colocar | mɛtʁ | verbos | | | Mettre → "meter": pôr, colocar.
croire | acreditar, crer | kʁwaʁ | verbos | | | Croire → "crer": je crois = eu creio / eu acho.
passer | passar | pase | verbos | | cr_ar_er |
penser | pensar | pɑ̃se | verbos | | cr_ar_er |
maintenant | agora | mɛ̃tnɑ̃ | tempo | | | main (mão) + tenant (segurando): o que está na mão é agora.
juste | só, apenas; justo | ʒyst | | | |
chose | coisa | ʃoz | cotidiano | f | | Soa "chóz": uma coisa chique.
quelque chose | alguma coisa | kɛlkə ʃoz | | | | quelque (algum) + chose (coisa).
aimer | gostar, amar | eme | verbos | | | Aimer → "amar": j'aime = eu gosto / eu amo.
donner | dar | dɔne | verbos | | | Donner → "doar": dar algo.
trouver | encontrar, achar | tʁuve | verbos | | | Trouver → "trovador", que achava rimas.
temps | tempo (duração e clima) | tɑ̃ | tempo | m | | A mesma palavra para tempo e clima: quel temps! = que tempo!
jour | dia | ʒuʁ | tempo | m | | Jour → "jornada, jornal": coisas do dia.
an | ano | ɑ̃ | tempo | m | |
homme | homem | ɔm | pessoas | m | |
femme | mulher; esposa | fam | pessoas | f | | Femme → "feminino". Atenção: pronuncia-se "fam".
enfant | criança; filho(a) | ɑ̃fɑ̃ | creche | m | | Enfant → "infantil".
fois | vez | fwa | tempo | f | | Soa "fuá": une fois = uma vez.
beaucoup | muito | boku | | | | beau coup = belo golpe → muito! Merci beaucoup.
peu | pouco | pø | | | | Soa quase "pô": un peu = um pouco.
trop | demais | tʁo | | | | Tropeçar de tanto: trop = demais.
encore | ainda; de novo | ɑ̃kɔʁ | | | | O "encore!" do show: de novo! Também: ainda.
déjà | já | deʒa | tempo | | | Déjà-vu = já visto.
jamais | nunca | ʒamɛ | | | | Igual ao nosso "jamais": nunca.
toujours | sempre; ainda | tuʒuʁ | tempo | | | tous les jours (todos os dias) → sempre.
peut-être | talvez | pøtɛtʁ | | | | peut + être = pode ser → talvez.
vraiment | realmente | vʁɛmɑ̃ | | | | vrai (verdadeiro) + -ment: verdadeiramente.
avant | antes | avɑ̃ | tempo | | | Avant → "avante, vanguarda": na frente, antes.
après | depois | apʁɛ | tempo | | | Après → "após".
sans | sem | sɑ̃ | | | | Sans soa "sã": sem. Sans sucre = sem açúcar.
chez | na casa de | ʃe | casa | | | Chez moi = na minha casa. Chez le médecin = no médico.
entre | entre | ɑ̃tʁ | | | |
depuis | desde; há (tempo) | dəpɥi | tempo | | | de + puis (depois): desde.
pendant | durante | pɑ̃dɑ̃ | tempo | | | Pendant → "pendente": enquanto dura, durante.
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
connaître | conhecer | kɔnɛtʁ | verbos | | | O "nn" faz o papel do "nh": co-nhe-cer → connaître.
entendre | ouvir | ɑ̃tɑ̃dʁ | verbos | | | Falso amigo: entendre = OUVIR. "Entender" é comprendre.
attendre | esperar | atɑ̃dʁ | verbos | | | Falso amigo: attendre = ESPERAR. "Atender" é répondre ou servir.
arriver | chegar; acontecer | aʁive | verbos | | | Arriver → "arribar" (chegar ao porto).
demander | pedir, perguntar | dəmɑ̃de | verbos | | | Falso amigo: demander = PEDIR/PERGUNTAR, não "demandar" na justiça.
rester | ficar | ʁɛste | verbos | | | Falso amigo: rester = FICAR. Je reste ici = eu fico aqui.
sortir | sair | sɔʁtiʁ | verbos | | | Falso amigo: sortir = SAIR (nada de "sortear"). La sortie = a saída.
regarder | olhar; assistir | ʁəɡaʁde | verbos | | | Regarder → "resguardar": guardar com os olhos.
appeler | chamar; ligar | aple | verbos | | | Appeler → "apelar": chamar. Je m'appelle = eu me chamo.
vivre | viver | vivʁ | verbos | | |
écouter | escutar | ekute | verbos | | cr_es_e |
chercher | procurar; buscar | ʃɛʁʃe | verbos | | | Soa "xerxê": quem xereta, procura. Venir chercher = vir buscar.
jouer | jogar, brincar; tocar | ʒwe | verbos | | | Jouer → "jogo": jogar, brincar.
tomber | cair | tɔ̃be | verbos | | | Tomber → "tombo": cair.
travailler | trabalhar | tʁavaje | trabalho | | | O "ill" é um "lh" enfraquecido: traba-lhar → travailler.
commencer | começar | kɔmɑ̃se | verbos | | |
finir | terminar | finiʁ | verbos | | | Finir → "fim, finalizar".
ouvrir | abrir | uvʁiʁ | verbos | | | Abra a porta para ouvir quem bate: ouvrir = ABRIR.
fermer | fechar | fɛʁme | verbos | | | Fermer → "ferrolho": fechar.
manger | comer | mɑ̃ʒe | verbos | | | Manger → "manjar": comer.
boire | beber | bwaʁ | verbos | | | "Beber" encolhido: je bois = eu bebo. Boisson = bebida.
dormir | dormir | dɔʁmiʁ | verbos | | |
écrire | escrever | ekʁiʁ | verbos | | cr_es_e |
lire | ler | liʁ | verbos | | | Lire → "lírica, leitura".
payer | pagar | peje | banco | | | Payer → "pay" do inglês: pagar.
acheter | comprar | aʃte | compras | | | Soa "achtê": ACHEI na loja e comprei!
apprendre | aprender | apʁɑ̃dʁ | verbos | | |
perdre | perder | pɛʁdʁ | verbos | | |
tenir | segurar | təniʁ | verbos | | | Tenir → "tenaz": segurar firme.
sentir | sentir | sɑ̃tiʁ | verbos | | |
revenir | voltar | ʁəvniʁ | verbos | | | re + venir (vir) = vir de novo → voltar.
essayer | tentar; experimentar | eseje | verbos | | | Essayer → "ensaiar": tentar.
aider | ajudar | ede | verbos | | | Aider → "aide" (assistente): ajudar.
habiter | morar | abite | casa | | cr_ar_er |
changer | trocar, mudar | ʃɑ̃ʒe | verbos | | | Changer → "câmbio" (change): trocar.
montrer | mostrar | mɔ̃tʁe | verbos | | cr_ar_er |
porter | levar; vestir | pɔʁte | verbos | | | Porter → "portar": levar consigo.
arrêter | parar | aʁete | verbos | | | Arrêter → "arrestar": fazer parar.
oublier | esquecer | ublije | verbos | | | Oublier → "obliterar": apagar da memória.
monter | subir | mɔ̃te | verbos | | | Monter → "montanha, montar": subir.
descendre | descer | desɑ̃dʁ | verbos | | |
entrer | entrar | ɑ̃tʁe | verbos | | cr_ar_er |
répondre | responder | ʁepɔ̃dʁ | verbos | | |
expliquer | explicar | ɛksplike | verbos | | cr_ar_er |
envoyer | enviar | ɑ̃vwaje | verbos | | |
recevoir | receber | ʁəsəvwaʁ | verbos | | |
marcher | andar; funcionar | maʁʃe | verbos | | | Marcher → "marchar". Ça marche! = funciona / combinado!
gagner | ganhar | ɡaɲe | trabalho | | | "Gn" = "nh": ga-nhar → gagner.
choisir | escolher | ʃwaziʁ | verbos | | | Choisir → "choice" (inglês): escolher.
préférer | preferir | pʁefeʁe | verbos | | |
aujourd'hui | hoje | oʒuʁdɥi | tempo | | | au jour d'hui = no dia de hoje.
demain | amanhã | dəmɛ̃ | tempo | | | "De manhã" → demain = amanhã.
hier | ontem | jɛʁ | tempo | | | O H é mudo: "iér". Ontem já era.
heure | hora | œʁ | tempo | f | |
minute | minuto | minyt | tempo | f | |
semaine | semana | s(ə)mɛn | tempo | f | |
mois | mês | mwa | tempo | m | | Soa "muá": un mois = um mês.
année | ano (duração) | ane | tempo | f | |
matin | manhã | matɛ̃ | tempo | m | | Matin → "matinal": de manhã.
soir | noite (fim do dia) | swaʁ | tempo | m | | Soir → "soirée", a festa da noite.
nuit | noite | nɥi | tempo | f | | Bonne nuit = boa noite (na hora de dormir).
moment | momento | mɔmɑ̃ | tempo | m | |
tard | tarde (atrasado) | taʁ | tempo | | |
tôt | cedo | to | tempo | | | "Tô cedo": tôt = cedo.
bientôt | em breve | bjɛ̃to | tempo | | | bien + tôt = bem cedo → em breve. À bientôt!
souvent | frequentemente | suvɑ̃ | tempo | | | Soa "suvã": muitas vezes.
vie | vida | vi | cotidiano | f | |
monde | mundo; gente | mɔ̃d | cotidiano | m | | Tout le monde = todo mundo.
fils | filho | fis | pessoas | m | | O L é mudo: "fis". Não confunda com fille.
fille | filha; menina | fij | pessoas | f | | O "ill" soa "i": "fii". Não confunda com fils (filho).
père | pai | pɛʁ | pessoas | m | | Père → "paterno".
mère | mãe | mɛʁ | pessoas | f | | Mère → "materno".
frère | irmão | fʁɛʁ | pessoas | m | | Frère → "frei" (frade = irmão).
sœur | irmã | sœʁ | pessoas | f | | Sœur → "sóror" (freira = irmã).
mari | marido | maʁi | pessoas | m | | Mari = "mari(do)".
famille | família | famij | pessoas | f | |
ami | amigo | ami | pessoas | m | |
parents | pais | paʁɑ̃ | pessoas | mpl | | Falso amigo: parents = PAIS (pai e mãe). Parentes = la famille.
gens | pessoas, gente | ʒɑ̃ | pessoas | mpl | | Gens = gente.
monsieur | senhor | məsjø | pessoas | m | | mon + sieur = meu senhor. Soa "messiê".
madame | senhora | madam | pessoas | f | |
bébé | bebê | bebe | creche | m | |
nom | nome | nɔ̃ | administracao | m | |
maison | casa | mɛzɔ̃ | casa | f | | Maison → "mansão": casa.
porte | porta | pɔʁt | casa | f | |
chambre | quarto | ʃɑ̃bʁ | casa | f | | Chambre → "câmara": o quarto.
eau | água | o | cotidiano | f | | Três letras, um som só: "ô". Uma água, ô!
argent | dinheiro; prata | aʁʒɑ̃ | banco | m | | Argentina = terra da prata. Argent = dinheiro.
travail | trabalho | tʁavaj | trabalho | m | |
place | lugar; praça | plas | lugares | f | |
ville | cidade | vil | lugares | f | | Ville → "vila": cidade.
pays | país | pei | lugares | m | |
rue | rua | ʁy | lugares | f | |
école | escola | ekɔl | creche | f | cr_es_e |
voiture | carro | vwatyʁ | transporte | f | | Voiture → "viatura": carro.
tête | cabeça | tɛt | saude | f | | O ^ esconde um S: tête ≈ "testa" → cabeça.
main | mão | mɛ̃ | saude | f | | Main → "manual": mão.
corps | corpo | kɔʁ | saude | m | |
cœur | coração | kœʁ | saude | m | | Cœur → "cordial": coração.
pied | pé | pje | saude | m | |
histoire | história | istwaʁ | cotidiano | f | |
problème | problema | pʁɔblɛm | cotidiano | m | |
question | pergunta, questão | kɛstjɔ̃ | cotidiano | f | cr_cao_tion |
idée | ideia | ide | cotidiano | f | |
raison | razão | ʁɛzɔ̃ | cotidiano | f | |
fin | fim | fɛ̃ | tempo | f | |
côté | lado | kote | lugares | m | | À côté = ao lado ("costado").
mot | palavra | mo | cotidiano | m | | Mot → "mote": palavra.
façon | jeito, maneira | fasɔ̃ | cotidiano | f | | Façon → "feição": jeito.
train | trem | tʁɛ̃ | transporte | m | |
bus | ônibus | bys | transporte | m | |
gare | estação de trem | ɡaʁ | transporte | f | | A "garagem" dos trens: la gare.
café | café | kafe | compras | m | |
pain | pão | pɛ̃ | compras | m | | Pain → "panificadora".
repas | refeição | ʁəpa | casa | m | | Repas → "repasto".
livre | livro | livʁ | cotidiano | m | |
téléphone | telefone | telefɔn | cotidiano | m | |
numéro | número | nymeʁo | administracao | m | |
adresse | endereço | adʁɛs | administracao | f | | Adresse → "address": endereço.
rendez-vous | compromisso, consulta | ʁɑ̃devu | administracao | m | | O encontro marcado: no médico, no banco, na commune.
bureau | escritório; mesa | byʁo | trabalho | m | | Bureau → "burocracia".
chef | chefe | ʃɛf | trabalho | m | |
docteur | doutor, médico | dɔktœʁ | saude | m | cr_or_eur |
médecin | médico | medsɛ̃ | saude | m | | Médecin → "medicina".
grand | grande; alto | ɡʁɑ̃ | descricao | | |
petit | pequeno | pəti | descricao | | | Petit → "petiz", criança pequena.
beau | bonito | bo | descricao | | | Soa "bô": "bô-nito".
nouveau | novo | nuvo | descricao | | | Art nouveau = arte nova.
vieux | velho | vjø | descricao | | | Soa "viê": velho.
jeune | jovem | ʒœn | pessoas | | | Jeune → "júnior". Cuidado: jaune = amarelo.
vrai | verdadeiro | vʁɛ | descricao | | | Vrai → "veraz, verídico".
seul | sozinho; único | sœl | descricao | | | Seul → "solo": sozinho.
dernier | último | dɛʁnje | descricao | | | Dernier → "derradeiro".
premier | primeiro | pʁəmje | numeros | | cr_eiro_ier |
prêt | pronto | pʁɛ | descricao | | | O ^ esconde um S: "presto" → pronto.
content | contente | kɔ̃tɑ̃ | sentimentos | | |
heureux | feliz | øʁø | sentimentos | | | heure (hora) boa: bonheur = felicidade.
désolé | desculpe, sinto muito | dezɔle | sentimentos | | | Désolé → "desolado": sinto muito.
fatigué | cansado | fatiɡe | sentimentos | | | Fatigué → "fadiga".
malade | doente | malad | saude | | | Quem está mal está malade.
facile | fácil | fasil | descricao | | |
difficile | difícil | difisil | descricao | | |
important | importante | ɛ̃pɔʁtɑ̃ | descricao | | |
possible | possível | pɔsibl | descricao | | cr_vel_ble |
cher | caro; querido | ʃɛʁ | compras | | | O "ch" veio do "ca": cher = caro. Chéri = querido.
chaud | quente | ʃo | cotidiano | | | Chaud → "cálido": quente.
froid | frio | fʁwa | cotidiano | | |
mal | mal; dor | mal | saude | | |
mieux | melhor (advérbio) | mjø | descricao | | | Soa "miê". Ça va mieux = está melhor.
meilleur | melhor (adjetivo) | mɛjœʁ | descricao | | | O "ill" é o nosso "lh": me-lhor → meilleur.
vite | rápido | vit | descricao | | | Vite → "vitamina": energia, rápido!
ensemble | juntos | ɑ̃sɑ̃bl | | | | O "ensemble" musical: todos juntos.
presque | quase | pʁɛsk | | | | Près (perto) + que: quase.
d'accord | de acordo, ok | dakɔʁ | cotidiano | | | "De acordo" → ok!
bonjour | bom dia, olá | bɔ̃ʒuʁ | cotidiano | | | bon (bom) + jour (dia).
bonsoir | boa noite (ao chegar) | bɔ̃swaʁ | cotidiano | | | bon + soir: boa noite ao chegar. Para dormir: bonne nuit.
salut | oi; tchau | saly | cotidiano | | | Salut → "saudação" (e "saúde!").
au revoir | até logo | o ʁəvwaʁ | cotidiano | | | "Ao rever": até a próxima!
pardon | desculpe, perdão | paʁdɔ̃ | cotidiano | | |
s'il vous plaît | por favor | sil vu plɛ | cotidiano | | | "Se lhe apraz" = se lhe agrada → por favor.
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
