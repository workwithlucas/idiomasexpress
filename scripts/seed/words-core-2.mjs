// Palavras 301–800 da lista de frequência do francês falado, em ordem
// aproximada de frequência (mesma curadoria de words-core.mjs: corpora de
// legendas/fala como Lexique 3 e OpenSubtitles, formas flexionadas agrupadas
// no lema). Junto com words-core.mjs formam o núcleo de 800 palavras.
// Palavras que antes estavam no complemento (words-extra.mjs) e são desta
// faixa de frequência foram movidas para cá sem mudança: o id delas (derivado
// do francês) continua o mesmo, então o progresso de revisão é preservado.
//
// Mesmo formato de words-core.mjs.
export const CORE_WORDS_2 = `
contre | contra | kɔ̃tʁ | | | |
eux | eles (depois de preposição) | ø | | | | "Eles" depois de preposição: avec eux = com eles. Soa "ê" com biquinho.
dont | de que, cujo | dɔ̃ | | | | Junta "de + que": la chose dont je parle = a coisa de que falo.
quel | qual | kɛl | | | | Quel, quelle, quels, quelles: os quatro soam "kél".
celui | aquele, o que | səlɥi | | | | Celui-ci = este aqui; celui-là = aquele lá.
ceux | aqueles, os que | sø | | | |
celle | aquela, a que | sɛl | | | |
aucun | nenhum | okœ̃ | | | | Anda com ne: je n'ai aucune idée = não tenho nenhuma ideia.
plusieurs | vários | plyzjœʁ | | | | Plus (mais) + … = mais de um: vários.
assez | bastante, o suficiente | ase | | | | Assez! = chega! J'en ai assez = estou farto.
moins | menos | mwɛ̃ | | | | O "–" da conta: dix moins deux = dez menos dois.
autant | tanto quanto | otɑ̃ | | | |
tant | tanto | tɑ̃ | | | | Tant pis = paciência; tant mieux = ainda bem.
surtout | sobretudo | syʁtu | | | | sur (sobre) + tout (tudo).
loin | longe | lwɛ̃ | lugares | | | Soa "luẽ": c'est loin? = é longe?
près | perto | pʁɛ | lugares | | | Près de la gare = perto da estação. Presque (quase) vem daqui.
devant | na frente de | dəvɑ̃ | lugares | | | De + avant (antes): na frente de.
derrière | atrás de | dɛʁjɛʁ | lugares | | |
sous | embaixo de, sob | su | lugares | | | Sous é o contrário de sur (sobre): sob.
vers | em direção a; por volta de | vɛʁ | | | | Vers midi = por volta do meio-dia.
jusqu'à | até | ʒyska | | | | Jusqu'à demain = até amanhã.
selon | segundo, de acordo com | səlɔ̃ | | | |
sauf | exceto, salvo | sof | | | | Sauf le lundi = salvo às segundas. O F soa.
malgré | apesar de | malɡʁe | | | | "Mal grado": malgré la pluie = apesar da chuva.
parmi | entre (vários) | paʁmi | | | |
donc | então, portanto | dɔ̃k | | | | O "então" de conclusão. O C final soa: "dõk".
puis | depois, em seguida | pɥi | | | |
ensuite | em seguida, depois | ɑ̃sɥit | | | | En + suite: em seguida.
enfin | enfim, finalmente | ɑ̃fɛ̃ | | | | Enfin = enfim, igualzinho.
d'abord | primeiro, antes | dabɔʁ | | | | "Da borda": começa pela beira, primeiro.
ainsi | assim | ɛ̃si | | | |
pourtant | porém, no entanto | puʁtɑ̃ | | | | Parece "portanto", mas é o contrário: PORÉM.
car | pois, porque | kaʁ | | | | Car não é carro: é "pois". Je reste, car il pleut.
ni | nem | ni | | | | Ni… ni = nem… nem.
sinon | senão | sinɔ̃ | | | |
lorsque | quando | lɔʁsk | | | | Um quand mais formal.
puisque | já que | pɥisk | | | |
quand même | mesmo assim | kɑ̃ mɛm | | | | Merci quand même = obrigado mesmo assim.
tellement | tanto, tão | tɛlmɑ̃ | | | | C'est tellement bon = é tão bom.
plutôt | de preferência; bem, bastante | plyto | | | | Plus tôt (mais cedo) → antes → de preferência.
environ | cerca de | ɑ̃viʁɔ̃ | | | | "Em volta de": environ dix euros = uns dez euros.
seulement | somente, só | sœlmɑ̃ | | | | Seul (só) + -ment = somente.
sûrement | com certeza | syʁmɑ̃ | | | | Sûr (seguro) + -ment: certamente.
exactement | exatamente | ɛɡzaktəmɑ̃ | | | cr_mente_ment |
simplement | simplesmente | sɛ̃pləmɑ̃ | | | cr_mente_ment |
finalement | finalmente | finalmɑ̃ | | | cr_mente_ment |
normalement | normalmente | nɔʁmalmɑ̃ | | | cr_mente_ment |
absolument | absolutamente | apsɔlymɑ̃ | | | cr_mente_ment |
justement | justamente | ʒystəmɑ̃ | | | cr_mente_ment |
complètement | completamente | kɔ̃plɛtəmɑ̃ | | | cr_mente_ment |
tout de suite | já, imediatamente | tutsɥit | | | | "Tudo em seguida": agora mesmo!
tout le monde | todo mundo | tu lə mɔ̃d | pessoas | | | Tout (todo) + le monde (o mundo) = todo mundo.
bien sûr | claro, com certeza | bjɛ̃ syʁ | | | | "Bem seguro": claro!
voilà | aí está; pronto | vwala | | | | Vois là! = veja lá! Serve para entregar algo ou encerrar um assunto.
voici | aqui está | vwasi | | | | Vois ici = veja aqui: voici mon passeport.
hein | né?, hein? | ɛ̃ | | | | O "né?" do francês falado: c'est bon, hein?
combien | quanto | kɔ̃bjɛ̃ | compras | | | Combien ça coûte? = quanto custa?
sembler | parecer | sɑ̃ble | verbos | | | Il semble que… = parece que… ("semblante").
devenir | tornar-se | dəvəniʁ | verbos | | | De + venir: "vir a ser".
rendre | devolver; deixar (alguém) | ʁɑ̃dʁ | verbos | | | "Render" de volta: devolver. Ça me rend heureux = isso me deixa feliz.
laisser | deixar | lese | verbos | | | Laisse-moi = me deixa.
suivre | seguir | sɥivʁ | verbos | | | Suivez-moi = sigam-me.
permettre | permitir | pɛʁmɛtʁ | verbos | | |
garder | guardar; cuidar de | ɡaʁde | verbos | | | Guardar → garder. Garder les enfants = cuidar das crianças.
poser | pôr; fazer (pergunta) | poze | verbos | | | Poser une question = fazer uma pergunta.
servir | servir | sɛʁviʁ | verbos | | |
mourir | morrer | muʁiʁ | verbos | | |
naître | nascer | nɛtʁ | verbos | | | O circunflexo esconde um S: naistre → nascer.
tuer | matar | tɥe | verbos | | |
sauver | salvar | sove | verbos | | | O L virou U: salvar → sauver.
rappeler | ligar de volta; lembrar | ʁaple | verbos | | | Re + appeler: chamar de novo. Je vous rappelle = eu te ligo de volta.
retrouver | reencontrar, achar de novo | ʁətʁuve | verbos | | | Re + trouver: achar de novo.
reprendre | retomar; pegar de novo | ʁəpʁɑ̃dʁ | verbos | | | Re + prendre.
apporter | trazer | apɔʁte | verbos | | | "Aportar": trazer algo até aqui.
amener | trazer (alguém) | amne | verbos | | | À + mener (conduzir): trazer alguém junto.
emmener | levar (alguém) | ɑ̃mne | verbos | | | Emmener les enfants à la crèche = levar as crianças à creche.
rentrer | voltar (para casa) | ʁɑ̃tʁe | verbos | | | Re + entrer: entrar de novo → voltar para casa.
retourner | voltar, retornar; virar | ʁətuʁne | verbos | | |
tourner | virar | tuʁne | verbos | | | Tournez à gauche = vire à esquerda.
bouger | mexer-se | buʒe | verbos | | | Ne bouge pas! = não se mexa!
courir | correr | kuʁiʁ | verbos | | |
s'asseoir | sentar-se | saswaʁ | verbos | | | Asseyez-vous = sentem-se.
se lever | levantar-se | sə ləve | verbos | | | Lever = levantar: lever la main = levantar a mão.
se coucher | deitar-se, ir dormir | sə kuʃe | verbos | | | Le coucher de soleil = o pôr do sol.
se réveiller | acordar | sə ʁeveje | verbos | | | O réveil é o despertador.
laver | lavar | lave | casa | | |
occuper | ocupar | ɔkype | verbos | | | S'occuper de = cuidar de.
plaire | agradar | plɛʁ | verbos | | | S'il vous plaît = se lhe agrada → por favor.
rire | rir | ʁiʁ | verbos | | |
pleurer | chorar | plœʁe | verbos | | | "Plorar": chorar.
crier | gritar | kʁije | verbos | | |
chanter | cantar | ʃɑ̃te | verbos | | | O "ca" virou "cha": cantar → chanter.
conduire | conduzir, dirigir | kɔ̃dɥiʁ | transporte | | cr_uzir_uire |
vendre | vender | vɑ̃dʁ | compras | | |
coûter | custar | kute | compras | | | O circunflexo esconde um S: couster → custar.
compter | contar | kɔ̃te | verbos | | | O P é mudo: "kõtê".
louer | alugar | lwe | casa | | | À louer = aluga-se.
décider | decidir | deside | verbos | | |
impression | impressão | ɛ̃pʁesjɔ̃ | cotidiano | f | cr_sao_sion |
décision | decisão | desizjɔ̃ | trabalho | f | cr_sao_sion |
promettre | prometer | pʁɔmɛtʁ | verbos | | |
proposer | propor | pʁɔpoze | verbos | | |
refuser | recusar | ʁəfyze | verbos | | |
nettoyer | limpar | netwaje | casa | | | Net = limpo: nettoyer = deixar tudo net.
ranger | arrumar | ʁɑ̃ʒe | casa | | | Range ta chambre! = arrume seu quarto!
réparer | consertar | ʁepaʁe | casa | | | Reparar → réparer: consertar.
toucher | tocar | tuʃe | verbos | | | Ne touche pas! = não toque!
jeter | jogar (fora) | ʒəte | verbos | | | Jeter à la poubelle = jogar no lixo.
frapper | bater | fʁape | verbos | | | Frapper à la porte = bater na porta.
enseigner | ensinar | ɑ̃seɲe | trabalho | | | O GN é o nosso NH: "ãsenhê".
étudier | estudar | etydje | verbos | | |
se souvenir | lembrar-se | sə suvniʁ | verbos | | | O souvenir de viagem é uma lembrança.
remarquer | notar, perceber | ʁəmaʁke | verbos | | | Marcar de novo: reparar em algo.
reconnaître | reconhecer | ʁəkɔnɛtʁ | verbos | | |
vérifier | verificar, conferir | veʁifje | verbos | | |
rêver | sonhar | ʁeve | verbos | | | O rêve é o sonho.
espérer | esperar (ter esperança) | ɛspeʁe | verbos | | | Só a esperança: j'espère que oui. Esperar na fila = attendre.
regretter | lamentar, arrepender-se | ʁəɡʁɛte | sentimentos | | | Je regrette = sinto muito.
remercier | agradecer | ʁəmɛʁsje | verbos | | | Vem de merci: dizer obrigado.
souhaiter | desejar | swete | verbos | | | Je vous souhaite une bonne journée = desejo um bom dia.
réussir | conseguir, ter sucesso | ʁeysiʁ | verbos | | | Réussir un examen = passar numa prova.
manquer | faltar; sentir falta | mɑ̃ke | sentimentos | | | Tu me manques = sinto sua falta (literalmente: você me falta).
quitter | sair de, deixar | kite | verbos | | | Quitar a conta com o lugar: sair dele.
rencontrer | encontrar; conhecer | ʁɑ̃kɔ̃tʁe | verbos | | | Enchanté de vous rencontrer = prazer em conhecê-lo.
terminer | terminar | tɛʁmine | verbos | | cr_ar_er |
durer | durar | dyʁe | tempo | | cr_ar_er |
dépendre | depender | depɑ̃dʁ | verbos | | | Ça dépend = depende.
exister | existir | ɛɡziste | verbos | | |
valoir | valer | valwaʁ | verbos | | | Ça vaut la peine = vale a pena.
suffire | bastar | syfiʁ | verbos | | | Ça suffit! = chega! Suficiente vem daqui.
obtenir | obter, conseguir | ɔptəniʁ | administracao | | |
offrir | oferecer; dar de presente | ɔfʁiʁ | verbos | | |
souffrir | sofrer | sufʁiʁ | saude | | |
découvrir | descobrir | dekuvʁiʁ | verbos | | |
mentir | mentir | mɑ̃tiʁ | verbos | | |
construire | construir | kɔ̃stʁɥiʁ | verbos | | |
grandir | crescer | ɡʁɑ̃diʁ | pessoas | | | Grand + -ir: ficar grande.
réfléchir | pensar, refletir | ʁefleʃiʁ | verbos | | |
prévenir | avisar | pʁevniʁ | verbos | | | Falso amigo parcial: prévenir quase sempre é AVISAR.
employer | empregar, usar | ɑ̃plwaje | trabalho | | |
appuyer | apertar (botão); apoiar | apɥije | verbos | | | Appuyez sur le bouton = aperte o botão.
s'ennuyer | entediar-se | sɑ̃nɥije | sentimentos | | | Ennui = tédio.
partager | dividir, compartilhar | paʁtaʒe | verbos | | | Partilhar → partager.
continuer | continuar | kɔ̃tinɥe | verbos | | cr_ar_er |
préparer | preparar | pʁepaʁe | casa | | cr_ar_er |
imaginer | imaginar | imaʒine | verbos | | cr_ar_er |
accepter | aceitar | aksɛpte | verbos | | cr_ar_er |
adorer | adorar | adɔʁe | verbos | | cr_ar_er |
voyager | viajar | vwajaʒe | transporte | | |
déranger | incomodar | deʁɑ̃ʒe | verbos | | | Des-arrumar → incomodar. Je vous dérange? = estou incomodando?
créer | criar | kʁee | verbos | | |
prouver | provar | pʁuve | verbos | | |
présenter | apresentar | pʁezɑ̃te | verbos | | | Je vous présente mon mari = este é o meu marido.
respecter | respeitar | ʁɛspɛkte | verbos | | |
sonner | tocar (campainha, telefone) | sɔne | casa | | | Ça sonne! = está tocando! Soar → sonner.
enlever | tirar | ɑ̃lve | verbos | | | Enlève tes chaussures = tire os sapatos.
défendre | defender; proibir | defɑ̃dʁ | verbos | | | Défense de fumer = proibido fumar.
paraître | parecer | paʁɛtʁ | verbos | | | Il paraît que… = parece que…
se taire | calar-se | sə tɛʁ | verbos | | | Tais-toi! = fique quieto!
pleuvoir | chover | pløvwaʁ | tempo | | | Il pleut = está chovendo. Pluie = chuva.
prévoir | prever | pʁevwaʁ | verbos | | |
revoir | rever | ʁəvwaʁ | verbos | | | Au revoir = até rever.
inviter | convidar | ɛ̃vite | verbos | | | Convite → invitation.
discuter | conversar | diskyte | verbos | | | Falso amigo: discuter é CONVERSAR (sem briga).
raconter | contar (história) | ʁakɔ̃te | verbos | | | Raconte-moi = me conta.
se dépêcher | apressar-se | sə depeʃe | verbos | | | Dépêche-toi! = anda logo!
s'inquiéter | preocupar-se | sɛ̃kjete | sentimentos | | | Ne t'inquiète pas = não se preocupe.
visiter | visitar | vizite | verbos | | cr_ar_er |
truc | coisa, treco | tʁyk | | m | | O "treco" do dia a dia.
gars | cara, rapaz | ɡɑ | pessoas | m | | O R e o S são mudos: "gá".
type | tipo; cara | tip | | m | | Un type sympa = um cara legal.
garçon | menino; garçom | ɡaʁsɔ̃ | pessoas | m | | Primeiro: menino. Para chamar o garçom, diga "s'il vous plaît".
copain | amigo; namorado | kɔpɛ̃ | pessoas | m | | "Companheiro": quem divide o pão.
copine | amiga; namorada | kɔpin | pessoas | f | |
papa | papai | papa | pessoas | m | |
maman | mamãe | mamɑ̃ | pessoas | f | |
oncle | tio | ɔ̃kl | pessoas | m | |
tante | tia | tɑ̃t | pessoas | f | |
cousin | primo | kuzɛ̃ | pessoas | m | |
grand-père | avô | ɡʁɑ̃pɛʁ | pessoas | m | | "Pai grande": avô.
grand-mère | avó | ɡʁɑ̃mɛʁ | pessoas | f | | "Mãe grande": avó.
voisin | vizinho | vwazɛ̃ | casa | m | | Vizinho → voisin (o nh vira "in" nasal).
collègue | colega | kɔlɛɡ | trabalho | | |
patron | chefe, patrão | patʁɔ̃ | trabalho | m | cr_ao_on |
couple | casal | kupl | pessoas | m | |
mort | morte; morto | mɔʁ | | f | |
amour | amor | amuʁ | sentimentos | m | |
guerre | guerra | ɡɛʁ | | f | |
paix | paz | pɛ | | f | | O X é mudo: "pé". Laisse-moi en paix = me deixa em paz.
dieu | deus | djø | | m | | Mon Dieu! = meu Deus!
ciel | céu | sjɛl | tempo | m | |
terre | terra | tɛʁ | | f | |
mer | mar | mɛʁ | lugares | f | | La mer (feminino). Soa igual a mère (mãe)!
soleil | sol | sɔlɛj | tempo | m | |
lune | lua | lyn | tempo | f | |
feu | fogo; semáforo | fø | transporte | m | | Feu rouge = sinal vermelho.
air | ar; jeito | ɛʁ | | m | | Avoir l'air = parecer: tu as l'air fatigué = você parece cansado.
pluie | chuva | plɥi | tempo | f | | "Pluvial": chuva.
neige | neve | nɛʒ | tempo | f | |
arbre | árvore | aʁbʁ | lugares | m | |
fleur | flor | flœʁ | | f | |
jardin | jardim | ʒaʁdɛ̃ | casa | m | |
parc | parque | paʁk | lugares | m | |
montagne | montanha | mɔ̃taɲ | lugares | f | cr_nh_gn |
campagne | campanha; interior (campo) | kɑ̃paɲ | lugares | f | cr_nh_gn |
plage | praia | plaʒ | lugares | f | |
lac | lago | lak | lugares | m | |
pont | ponte | pɔ̃ | lugares | m | | Só o nasal "põ": o T é mudo.
route | estrada | ʁut | transporte | f | | A "rota" de carro: estrada.
chemin | caminho | ʃəmɛ̃ | lugares | m | | O "ca" virou "che": caminho → chemin.
quartier | bairro | kaʁtje | lugares | m | | O "quarteirão": bairro.
village | aldeia, vila | vilaʒ | lugares | m | |
centre | centro | sɑ̃tʁ | lugares | m | |
coin | canto; esquina | kwɛ̃ | lugares | m | | Au coin de la rue = na esquina.
bord | beira, borda | bɔʁ | | m | | Au bord de la mer = à beira-mar.
fond | fundo | fɔ̃ | | m | | Au fond du couloir = no fundo do corredor.
milieu | meio | miljø | | m | | Mi + lieu (lugar): o lugar do meio.
droite | direita | dʁwat | lugares | f | | À droite = à direita. O "oi" soa "uá".
gauche | esquerda | ɡoʃ | lugares | f | | À gauche = à esquerda ("gauche" = desajeitado, sem jeito).
face | cara; frente | fas | | f | | En face de = em frente a.
œil | olho | œj | saude | m | | Plural irregular: un œil, deux yeux ("iê").
oreille | orelha; ouvido | ɔʁɛj | saude | f | cr_lh_ill |
bouche | boca | buʃ | saude | f | |
nez | nariz | ne | saude | m | | O Z é mudo: "nê".
dent | dente | dɑ̃ | saude | f | | Soa "dã": o T é mudo.
visage | rosto | vizaʒ | saude | m | | A "visagem": o rosto.
doigt | dedo | dwa | saude | m | | Só se ouve "duá": G e T mudos.
sang | sangue | sɑ̃ | saude | m | |
peau | pele | po | saude | f | |
voix | voz | vwa | | f | |
santé | saúde | sɑ̃te | saude | f | | À votre santé! = saúde!
maladie | doença | maladi | saude | f | | Malade (doente) → maladie (doença).
service | serviço | sɛʁvis | trabalho | m | cr_icio_ice |
police | polícia | pɔlis | | f | cr_icio_ice |
justice | justiça | ʒystis | administracao | f | cr_icio_ice |
sécurité | segurança | sekyʁite | | f | |
loi | lei | lwa | administracao | f | |
droit | direito | dʁwa | administracao | m | | Tout droit = em frente, reto.
affaire | assunto, caso; negócio | afɛʁ | trabalho | f | | Les affaires = as coisas; os negócios.
réponse | resposta | ʁepɔ̃s | | f | |
pensée | pensamento | pɑ̃se | | f | |
sens | sentido | sɑ̃s | | m | | O S final soa: "sãs".
point | ponto | pwɛ̃ | | m | |
moyen | meio (recurso) | mwajɛ̃ | | m | |
manière | maneira | manjɛʁ | | f | |
sorte | tipo, espécie | sɔʁt | | f | | Falso amigo: une sorte de = um tipo de. Sorte é chance.
genre | gênero, tipo | ʒɑ̃ʁ | | m | |
partie | parte; partida | paʁti | | f | |
part | parte, pedaço | paʁ | | f | | Quelque part = em algum lugar.
reste | resto | ʁɛst | | m | |
nombre | número (quantidade) | nɔ̃bʁ | numeros | m | |
chiffre | algarismo, número | ʃifʁ | numeros | m | | "Cifra": um algarismo.
euro | euro | øʁo | banco | m | |
centime | centavo | sɑ̃tim | banco | m | |
boulot | trabalho (informal) | bulo | trabalho | m | | O "trampo" do francês.
emploi | emprego | ɑ̃plwa | trabalho | m | |
métier | profissão, ofício | metje | trabalho | m | |
réunion | reunião | ʁeynjɔ̃ | trabalho | f | |
projet | projeto | pʁɔʒɛ | trabalho | m | |
plan | plano; mapa | plɑ̃ | | m | |
groupe | grupo | ɡʁup | | m | |
aide | ajuda | ɛd | | f | |
besoin | necessidade | bəzwɛ̃ | | m | | Avoir besoin de = precisar de.
envie | vontade | ɑ̃vi | sentimentos | f | | Avoir envie de = ter vontade de.
honte | vergonha | ɔ̃t | sentimentos | f | |
faim | fome | fɛ̃ | | f | | Em francês se TEM fome: j'ai faim.
soif | sede | swaf | | f | | J'ai soif = tenho sede.
sommeil | sono | sɔmɛj | | m | | J'ai sommeil = estou com sono.
chance | sorte | ʃɑ̃s | | f | | Falso amigo: chance = SORTE. Bonne chance!
force | força | fɔʁs | | f | |
rêve | sonho | ʁɛv | | m | |
secret | segredo | səkʁɛ | | m | |
mensonge | mentira | mɑ̃sɔ̃ʒ | | m | |
erreur | erro | ɛʁœʁ | | f | |
faute | culpa; erro | fot | | f | | C'est pas ma faute = não é culpa minha.
photo | foto | fɔto | | f | |
film | filme | film | | m | |
jeu | jogo; brincadeira | ʒø | | m | |
sport | esporte | spɔʁ | | m | |
chanson | canção, música | ʃɑ̃sɔ̃ | | f | | O "ca" virou "cha": canção → chanson.
journal | jornal | ʒuʁnal | | m | |
lettre | carta; letra | lɛtʁ | | f | |
papier | papel | papje | administracao | m | | Les papiers = os documentos.
page | página | paʒ | | f | |
phrase | frase | fʁaz | | f | |
langue | língua | lɑ̃ɡ | | f | |
prénom | primeiro nome | pʁenɔ̃ | administracao | m | | Pré + nom: o nome que vem antes do sobrenome.
portable | celular | pɔʁtabl | | m | | "Portátil": o celular.
ordinateur | computador | ɔʁdinatœʁ | trabalho | m | | O "ordenador": o computador.
mail | e-mail | mɛl | trabalho | m | |
écran | tela | ekʁɑ̃ | | m | |
vélo | bicicleta | velo | transporte | m | |
avion | avião | avjɔ̃ | transporte | m | cr_ao_on |
bateau | barco | bato | transporte | m | |
taxi | táxi | taksi | transporte | m | |
arrêt | ponto, parada | aʁɛ | transporte | m | | Arrêt de bus = ponto de ônibus.
ligne | linha | liɲ | transporte | f | cr_nh_gn |
billet | bilhete, passagem; cédula | bijɛ | transporte | m | cr_lh_ill |
ticket | tíquete, bilhete | tikɛ | transporte | m | |
vacances | férias | vakɑ̃s | | fpl | | "Vacância": tempo livre, férias.
hôtel | hotel | otɛl | lugares | m | |
restaurant | restaurante | ʁɛstɔʁɑ̃ | lugares | m | |
bar | bar | baʁ | lugares | m | |
magasin | loja | maɡazɛ̃ | compras | m | | O "magazine" das lojas de departamento: loja.
marché | feira, mercado | maʁʃe | compras | m | |
supermarché | supermercado | sypɛʁmaʁʃe | compras | m | |
classe | turma, sala de aula; classe | klas | | f | |
cours | aula; curso | kuʁ | | m | |
élève | aluno | elɛv | | | |
examen | prova, exame | ɛɡzamɛ̃ | | m | |
immeuble | prédio | imœbl | casa | m | | O "imóvel": o prédio.
étage | andar | etaʒ | casa | m | | Au premier étage = no primeiro andar.
cuisine | cozinha | kɥizin | casa | f | |
salon | salão; sala de estar | salɔ̃ | casa | m | cr_ao_on |
salle de bain | banheiro | sal də bɛ̃ | casa | f | | "Sala de banho".
toilettes | banheiro (vaso) | twalɛt | casa | fpl | | Où sont les toilettes? = onde fica o banheiro?
lit | cama | li | casa | m | | O T é mudo: "li".
table | mesa | tabl | casa | f | |
chaise | cadeira | ʃɛz | casa | f | |
fenêtre | janela | fənɛtʁ | casa | f | |
mur | parede; muro | myʁ | casa | m | |
lumière | luz | lymjɛʁ | casa | f | |
douche | chuveiro, ducha | duʃ | casa | f | |
cadeau | presente | kado | | m | |
mariage | casamento | maʁjaʒ | pessoas | m | |
Noël | Natal | nɔɛl | tempo | m | |
petit-déjeuner | café da manhã | pəti deʒœne | cotidiano | m | | Petit (pequeno) + déjeuner (almoço): o "pequeno almoço".
déjeuner | almoço | deʒœne | cotidiano | m | |
dîner | jantar | dine | cotidiano | m | |
sucre | açúcar | sykʁ | compras | m | |
sel | sal | sɛl | compras | m | |
thé | chá | te | compras | m | |
bière | cerveja | bjɛʁ | compras | f | |
verre | copo; vidro | vɛʁ | casa | m | |
tasse | xícara | tas | casa | f | |
robe | vestido | ʁɔb | compras | f | | A "roupa" longa: vestido.
pantalon | calça | pɑ̃talɔ̃ | compras | m | |
chaussure | sapato | ʃosyʁ | compras | f | | O "calçado".
manteau | casaco | mɑ̃to | compras | m | | Um "manto": casaco.
couleur | cor | kulœʁ | descricao | f | | Cor → couleur (lembre de "colorido").
blanc | branco | blɑ̃ | descricao | | |
noir | preto | nwaʁ | descricao | | | "Noir" dos filmes: preto.
rouge | vermelho | ʁuʒ | descricao | | | O "ruge" (blush) é vermelho.
bleu | azul | blø | descricao | | |
vert | verde | vɛʁ | descricao | | | Só "vér": o T é mudo.
gris | cinza | ɡʁi | descricao | | | O S é mudo: "grí".
rose | rosa | ʁoz | descricao | | |
jaune | amarelo | ʒon | descricao | | | Jaune soa "jôn", com O fechado. Jeune (jovem) tem o som "œ".
mauvais | ruim, mau | movɛ | descricao | | |
joli | bonito | ʒɔli | descricao | | |
gros | grande, gordo | ɡʁo | descricao | | | "Grosso": grandão.
haut | alto | o | descricao | | | O H e o T são mudos: "ô".
bas | baixo | ba | descricao | | |
long | longo, comprido | lɔ̃ | descricao | | |
court | curto | kuʁ | descricao | | |
large | largo | laʁʒ | descricao | | |
plein | cheio | plɛ̃ | descricao | | | "Pleno": cheio.
vide | vazio | vid | descricao | | |
léger | leve | leʒe | descricao | | |
lourd | pesado | luʁ | descricao | | |
dur | duro; difícil | dyʁ | descricao | | |
doux | doce; macio | du | descricao | | | O X é mudo: "du".
fort | forte | fɔʁ | descricao | | |
faible | fraco | fɛbl | descricao | | |
riche | rico | ʁiʃ | descricao | | |
pauvre | pobre | povʁ | descricao | | |
libre | livre | libʁ | descricao | | | Libre? = está livre? (lugar, horário)
sûr | seguro, certo | syʁ | descricao | | | Sûr (com chapéu) = seguro. Sur (sem) = sobre.
clair | claro | klɛʁ | descricao | | |
simple | simples | sɛ̃pl | descricao | | |
calme | calmo | kalm | descricao | | |
tranquille | tranquilo | tʁɑ̃kil | descricao | | |
drôle | engraçado | dʁol | descricao | | |
bizarre | estranho | bizaʁ | descricao | | | Falso amigo leve: bizarre = ESTRANHO (não "bizarro" exagerado).
étrange | estranho | etʁɑ̃ʒ | descricao | | |
normal | normal | nɔʁmal | descricao | | |
spécial | especial | spesjal | descricao | | |
parfait | perfeito | paʁfɛ | descricao | | |
génial | genial, ótimo | ʒenjal | descricao | | |
super | ótimo, muito bom | sypɛʁ | descricao | | |
gentil | gentil, simpático | ʒɑ̃ti | descricao | | |
méchant | malvado | meʃɑ̃ | descricao | | |
sympa | simpático, legal | sɛ̃pa | descricao | | |
intelligent | inteligente | ɛ̃teliʒɑ̃ | descricao | | |
bête | bobo, burro | bɛt | descricao | | | Bête = bicho. "Que bicho!" → que bobo.
fou | louco | fu | descricao | | |
sérieux | sério | seʁjø | descricao | | |
énorme | enorme | enɔʁm | descricao | | |
entier | inteiro | ɑ̃tje | descricao | | | Inteiro → entier. En entier = por inteiro.
ancien | antigo; ex- | ɑ̃sjɛ̃ | descricao | | | Antes do nome = ex-: mon ancien travail.
moderne | moderno | mɔdɛʁn | descricao | | |
prochain | próximo | pʁɔʃɛ̃ | tempo | | | La semaine prochaine = semana que vem.
différent | diferente | difeʁɑ̃ | descricao | | |
pareil | igual | paʁɛj | descricao | | | "Parelho": igual.
utile | útil | ytil | descricao | | |
lent | lento | lɑ̃ | descricao | | |
rapide | rápido | ʁapid | descricao | | |
faux | falso; errado | fo | descricao | | |
vivant | vivo | vivɑ̃ | descricao | | |
terrible | terrível | tɛʁibl | descricao | | cr_vel_ble |
impossible | impossível | ɛ̃pɔsibl | descricao | | cr_vel_ble |
responsable | responsável | ʁɛspɔ̃sabl | trabalho | | cr_vel_ble |
salaire | salário | salɛʁ | banco | m | cr_ario_aire |
humain | humano | ymɛ̃ | pessoas | | cr_ano_ain |
américain | americano | ameʁikɛ̃ | pessoas | | cr_ano_ain |
français | francês | fʁɑ̃sɛ | trabalho | m | |
anglais | inglês | ɑ̃ɡlɛ | trabalho | m | |
allemand | alemão | almɑ̃ | trabalho | m | |
étranger | estrangeiro | etʁɑ̃ʒe | administracao | m | cr_es_e |
onze | onze | ɔ̃z | numeros | | |
douze | doze | duz | numeros | | |
treize | treze | tʁɛz | numeros | | |
quatorze | catorze | katɔʁz | numeros | | |
quinze | quinze | kɛ̃z | numeros | | |
seize | dezesseis | sɛz | numeros | | |
trente | trinta | tʁɑ̃t | numeros | | |
quarante | quarenta | kaʁɑ̃t | numeros | | |
cinquante | cinquenta | sɛ̃kɑ̃t | numeros | | |
soixante | sessenta | swasɑ̃t | numeros | | | Depois vem soixante-dix (70 = 60 + 10)!
zéro | zero | zeʁo | numeros | | |
million | milhão | miljɔ̃ | numeros | m | cr_ao_on |
demi | meio | dəmi | numeros | | | Une heure et demie = uma hora e meia.
deuxième | segundo (ordinal) | døzjɛm | numeros | | |
troisième | terceiro | tʁwazjɛm | numeros | | |
moitié | metade | mwatje | numeros | f | |
lundi | segunda-feira | lœ̃di | tempo | m | | Dia da Lua (lune).
mardi | terça-feira | maʁdi | tempo | m | | Dia de Marte.
mercredi | quarta-feira | mɛʁkʁədi | tempo | m | | Dia de Mercúrio.
jeudi | quinta-feira | ʒødi | tempo | m | | Dia de Júpiter.
vendredi | sexta-feira | vɑ̃dʁədi | tempo | m | | Dia de Vênus.
samedi | sábado | samdi | tempo | m | |
dimanche | domingo | dimɑ̃ʃ | tempo | m | |
week-end | fim de semana | wikɛnd | tempo | m | |
midi | meio-dia | midi | tempo | m | |
minuit | meia-noite | minɥi | tempo | m | |
seconde | segundo | səɡɔ̃d | tempo | f | | O C soa como G: "segõd".
instant | instante | ɛ̃stɑ̃ | tempo | m | |
siècle | século | sjɛkl | tempo | m | |
date | data | dat | tempo | f | |
âge | idade | ɑʒ | pessoas | m | | Quel âge as-tu? = quantos anos você tem?
passé | passado | pase | tempo | m | |
avenir | futuro | avniʁ | tempo | m | | À + venir: o que está por vir.
retard | atraso | ʁətaʁ | tempo | m | | "Retardar": en retard = atrasado.
début | começo, início | deby | tempo | m | | Estreia é "début" também: o começo.
printemps | primavera | pʁɛ̃tɑ̃ | tempo | m | | "Primeiro tempo" do ano.
été | verão | ete | tempo | m | | Igual ao particípio de être: l'été = o verão.
automne | outono | otɔn | tempo | m | | O M é mudo: "otón".
hiver | inverno | ivɛʁ | tempo | m | |
janvier | janeiro | ʒɑ̃vje | tempo | m | cr_eiro_ier |
février | fevereiro | fevʁije | tempo | m | cr_eiro_ier |
mars | março | maʁs | tempo | m | |
avril | abril | avʁil | tempo | m | |
mai | maio | mɛ | tempo | m | |
juin | junho | ʒɥɛ̃ | tempo | m | |
juillet | julho | ʒɥijɛ | tempo | m | |
août | agosto | ut | tempo | m | | Só "ut": o A e o T somem.
septembre | setembro | sɛptɑ̃bʁ | tempo | m | |
octobre | outubro | ɔktɔbʁ | tempo | m | |
novembre | novembro | nɔvɑ̃bʁ | tempo | m | |
décembre | dezembro | desɑ̃bʁ | tempo | m | |
à bientôt | até logo | a bjɛ̃to | cotidiano | | | Bientôt (logo) + à: até logo.
bonne nuit | boa noite (ao dormir) | bɔn nɥi | cotidiano | | | Só na hora de dormir. Ao chegar: bonsoir.
bonne journée | tenha um bom dia | bɔn ʒuʁne | cotidiano | | | Para se despedir de manhã ou à tarde.
de rien | de nada | də ʁjɛ̃ | cotidiano | | | "De nada" palavra por palavra: rien = nada.
enchanté | muito prazer | ɑ̃ʃɑ̃te | cotidiano | | | "Encantado" em conhecer você.
ça va | tudo bem | sa va | cotidiano | | | Pergunta e resposta ao mesmo tempo: Ça va? — Ça va!
bon appétit | bom apetite | bɔ̃n‿apeti | cotidiano | | |
chien | cachorro | ʃjɛ̃ | cotidiano | m | | Chien → "canino".
chat | gato | ʃa | cotidiano | m | | Soa "xá": o gato tomando chá.
attention | atenção | atɑ̃sjɔ̃ | cotidiano | f | cr_cao_tion |
situation | situação | sitɥasjɔ̃ | cotidiano | f | cr_cao_tion |
information | informação | ɛ̃fɔʁmasjɔ̃ | administracao | f | cr_cao_tion |
liberté | liberdade | libɛʁte | cotidiano | f | cr_dade_te |
vérité | verdade | veʁite | cotidiano | f | cr_dade_te |
société | sociedade; empresa | sɔsjete | trabalho | f | cr_dade_te |
qualité | qualidade | kalite | descricao | f | cr_dade_te |
musique | música | myzik | cotidiano | f | cr_ico_ique |
pratique | prático | pʁatik | descricao | | cr_ico_ique |
pharmacie | farmácia | faʁmasi | saude | f | cr_ia_ie |
professeur | professor | pʁɔfesœʁ | trabalho | m | cr_or_eur |
voyage | viagem | vwajaʒ | transporte | m | cr_agem_age |
message | mensagem | mesaʒ | cotidiano | m | cr_agem_age |
courage | coragem | kuʁaʒ | sentimentos | m | cr_agem_age |
étudiant | estudante | etydjɑ̃ | trabalho | m | cr_es_e |
hôpital | hospital | ɔpital | saude | m | cr_circ_s |
fête | festa | fɛt | cotidiano | f | cr_circ_s |
goût | gosto, sabor | ɡu | compras | m | cr_circ_s |
vin | vinho | vɛ̃ | compras | m | | Vin → vinho: nasal aberto, quase "vẽ".
peur | medo | pœʁ | sentimentos | f | | Peur → "pavor": medo.
cheveux | cabelo | ʃəvø | saude | mpl | | Soa "xevê": os cabelos.
banque | banco (instituição) | bɑ̃k | banco | f | | Feminino em francês: LA banque.
compte | conta (bancária) | kɔ̃t | banco | m | | Compte ← compter (contar): a conta.
carte | cartão | kaʁt | banco | f | | Carte bancaire = cartão do banco.
prix | preço | pʁi | compras | m | | Prix → "preço" (e prêmio: Grand Prix).
sac | sacola | sak | compras | m | |
clé | chave | kle | casa | f | | Clé → "clave" (chave musical).
bras | braço | bʁa | saude | m | | Soa "brá": o S é mudo.
propre | limpo; próprio | pʁɔpʁ | casa | | | Depois do nome = limpo: une chambre propre. Antes = próprio.
document | documento | dɔkymɑ̃ | administracao | m | |
poisson | peixe | pwasɔ̃ | compras | m | | SS = som de S: poisson → "piscicultura" (peixe).
`;
