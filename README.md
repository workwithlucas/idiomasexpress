# Poliglotas — o francês que já é seu vizinho

**App no ar:** <https://poliglotas.netlify.app>

**Poliglotas** é um PWA para acelerar o francês de dois falantes de português brasileiro (perfis **Lucas** e **Eduarda**). Funciona 100% offline depois da primeira abertura e pode ser instalado na tela inicial do celular.

**Stack:** Vite + TypeScript (sem framework) · IndexedDB via [`idb`](https://github.com/jakearchibald/idb) · Web Speech API (TTS) · MediaRecorder + Azure Speech (avaliação de pronúncia) · [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (revisão espaçada) · `vite-plugin-pwa` (service worker/Workbox) · Netlify.

**Identidade.** O app segue o design system aprovado **Poliglotas**, implementado com os valores exatos de `tokens.json`:
- **Cores:** 9 tokens (surface, surface-raised, surface-soft, ink, ink-soft, border, primary, accent, on-accent), no tema claro e no escuro.
- **Tipografia:** Bricolage Grotesque 700 (display 34/40 e title 22/28) e Inter (subtitle 17/24/600, body 15/22/400, body-sm 13/18/500, button 15/20/600).
- **Espaçamento:** 4/8/12/16/24/32. **Raios:** 12/20/999. **Sombra:** `shadow-card`.

Os tokens estão no topo de `src/styles/main.css`, e o resto da folha usa só eles. O logomark (o "P" geométrico com o traço coral na base) aparece no cabeçalho, no favicon e nos ícones do PWA. Os 12 ícones do componente Icons foram copiados sem mudança para `src/ui/icons.ts`. As fontes vêm embutidas via `@fontsource`, para funcionar offline.

---

## Como o app ensina

### Sessão de hoje (tela de entrada)
Cada dia começa com uma sessão de **16 passos intercalados**: tipos de exercício misturados, **nunca dois do mesmo tipo seguidos**, porque intercalar dá retenção melhor a longo prazo do que estudar em blocos.
- **Metade é lembrar palavras:** primeiro as que **venceram** na revisão espaçada (prioridade), depois palavras novas do dia.
- **Metade é conteúdo novo:** descobrir padrões de palavras-irmãs e de leitura, completar frases (sempre uma com ligação) e treinar o ouvido.
- Na **primeira sessão da vida**, o passo 2 é uma descoberta (Palavras-irmãs) e o passo 4 é uma frase com "Fale você", para os dois momentos-chave acontecerem nos primeiros minutos. Depois disso, a ordem é sempre sorteada.
- A sessão fica salva neste aparelho: dá para pausar (✕) e continuar depois. O tamanho está em `SESSION_SIZE` (`src/lib/session.ts`).

### Os 8 módulos (também acessíveis sozinhos, em "Por conta própria")

| Módulo | Mecanismo |
|--------|-----------|
| **Palavras-irmãs** (cognatos) | **Por dedução, não por declaração.** Você vê 3 pares PT → FR *sem a regra*, toca no pedaço que muda, e **só então** aparece a regra ("-ção → -tion"), como confirmação. Depois aplica sozinho em 2–3 palavras novas, digitando. 20 padrões. Aba de **falsos amigos** (attendre ≠ atender…). |
| **Como se lê** (regras de leitura) | Mesmo fluxo: ouve 3 palavras, deduz como aquelas letras soam (2–3 opções), recebe a confirmação e depois reconhece palavras novas pelo ouvido. 35 regras. |
| **Ouvido fino** (pares mínimos) | Treino de **alta variabilidade de falantes**: cada rodada sorteia outra voz francesa do aparelho, priorizando uma feminina e uma masculina. Com uma voz só, varia de leve a altura e a velocidade (plano B). As duas palavras de uma rodada saem na mesma voz. |
| **Monte a frase** | Complete o molde e ouça a frase inteira. Os pontos de **ligação** (liaison: *petit‿ami*, *vous‿êtes*) aparecem marcados, e o áudio já sai ligado. Depois, **"Fale você"**: você repete e vê sua melodia ao lado da do francês. 40 moldes, 10 feitos para gerar ligação. |
| **Truques de memória** | Ganchos em português para as palavras que **não** se parecem com o português. |
| **Fale e compare** | Grave-se e veja **sua melodia e seu ritmo** × os do francês (no aparelho, offline), mais a **nota por som** do Azure (por palavra e fonema), quando configurado. Uma não depende da outra. |
| **Revisar** (revisão espaçada, FSRS) | O cartão alterna a direção pelo número de revisões feitas (campo `reps`, que já existia no `ReviewState`): **par → reconhecer** (francês → português), **ímpar → produzir** (português → francês). |
| **Situações reais** | Creche, banco, entrevista, médico, mercado, commune, dia a dia. A prática alterna **produzir** (ver a situação em português e dizer em francês) e **reconhecer** (ouvir e entender), começando por produzir: pelo menos metade pede produção. |

### Melodia e ritmo ("Sua melodia")
O Azure só dá nota de prosódia para inglês. Para o francês, o app mede a **altura da voz (pitch)** de quem fala com **autocorrelação**, sem bibliotecas (`src/lib/pitch.ts`). A medição é feita **ao vivo** durante a gravação, via `AnalyserNode` da Web Audio API (`src/lib/pitchTracker.ts`), e cai para a análise do arquivo gravado se a captura ao vivo falhar. O gráfico sobrepõe duas linhas no mesmo eixo de tempo: **francês** (meta) e **você**. Embaixo, as sílabas aparecem como batidas, para comparar o ritmo. Duas dicas curtas: a direção da voz no fim da frase e o ritmo.

**Importante:** a Web Speech API toca a voz nativa direto no alto-falante e **não entrega as amostras de áudio**, então não há como medir o pitch dela no navegador. Por isso a linha "francês" é **modelada** (`src/lib/prosody.ts`) a partir das regras de entonação do francês, que são bem regulares:
- sílabas de duração parecida;
- a última sílaba de cada grupo é mais longa;
- afirmativa desce no fim, pergunta de sim/não sobe, pergunta com *où/quand/comment…* desce.

Quando a voz do aparelho informa o início de cada palavra (eventos `boundary`), o **ritmo** da meta usa esses tempos reais. O extrator de pitch recebe amostras genéricas: se um dia houver áudio nativo gravado (ex.: Azure TTS), a mesma função o analisa. Veja "Known issues".

---

## Rodar localmente

Requisitos: **Node 20+** (testado com Node 22).

```bash
npm install
npm run dev          # http://localhost:5173
```

Outros comandos:

```bash
npm run build        # gera o seed, checa os tipos e cria dist/ (com service worker)
npm run preview      # serve o build de produção em http://localhost:4173
npm test             # testes unitários (seed, FSRS, IndexedDB, import/export, proxy Azure)
npm run test:e2e     # ponta a ponta no Chromium: fluxo completo, FSRS, offline e falhas (rode `npm run build` antes)
npm run seed         # regenera public/seed/seed.json a partir de scripts/seed/
npm run icons        # regenera os ícones PNG a partir de public/favicon.svg
```

> O service worker só é registrado no build de produção (`npm run build && npm run preview`), então é aí que dá para testar o modo offline e a instalação.

### Testar no celular na mesma rede

```bash
npm run dev -- --host
```

Abra o endereço `http://<ip-do-computador>:5173` no celular. Atenção: o **microfone** só funciona em HTTPS ou `localhost`; para testar a gravação no celular, use o deploy da Netlify (que já é HTTPS).

---

## Configurar o Azure Speech (avaliação de pronúncia)

A chave **nunca vai para o navegador**. O app envia o áudio para `/api/pronunciation`, e quem chama o Azure é:
- em desenvolvimento, um middleware do Vite (`vite.config.ts`);
- em produção, uma Netlify Function (`netlify/functions/pronunciation.mts`).

As duas usam o mesmo código: `server/pronunciation.ts`.

### 1. Criar o recurso Azure Speech gratuito (passo a passo)
1. **Conta:** entre em <https://portal.azure.com> com uma conta Microsoft. Sem assinatura, crie uma conta gratuita em <https://azure.microsoft.com/free>. O cartão pedido é só para confirmar identidade: o plano F0 abaixo não cobra nada.
2. **Criar o recurso:** no topo do portal, busque **"Speech services"** (ou "Serviços de Fala") → **Create / Criar**.
3. Preencha:
   - **Subscription:** a sua assinatura.
   - **Resource group:** *Create new* → `poliglotas` (qualquer nome).
   - **Region:** a mais perto, ex.: **France Central** (`francecentral`) ou **West Europe** (`westeurope`). A avaliação de pronúncia em fr-FR funciona nas duas.
   - **Name:** um nome único, ex.: `poliglotas-fala-lucas`.
   - **Pricing tier:** **Free F0**. Ele dá **5 horas de áudio por mês**, e cada gravação do app tem poucos segundos, o que dá milhares de notas por mês. Cada assinatura só pode ter **um** recurso F0 de Speech.
4. **Review + create → Create.** Espere o "Deployment complete" (menos de 1 minuto) e clique em **Go to resource**.
5. **Pegar a chave e a região:** no menu do recurso, abra **Resource Management → Keys and Endpoint**.
   - **KEY 1** (botão de copiar): é a sua `AZURE_SPEECH_KEY`.
   - **Location/Region** (ex.: `francecentral`): é a sua `AZURE_SPEECH_REGION`. Use o código, em minúsculas e sem espaço, não o nome "France Central".

### 2. Colar no `.env` (desenvolvimento local)

```bash
cp .env.example .env
```

Edite o `.env` na raiz do projeto. Ele está no `.gitignore` e **nunca é commitado**:

```env
AZURE_SPEECH_KEY=cole-a-KEY-1-aqui
AZURE_SPEECH_REGION=francecentral
```

Reinicie o `npm run dev` (ou `npm run preview`): o `.env` só é lido quando o servidor sobe. Confira em **Ajustes → Serviço de nota**:

| O que aparece | O que significa |
|---|---|
| **configurado** | Chave aceita. Pronto para usar. |
| **chave recusada** | O Azure recusou a chave, ou a chave é de outra região. Confira KEY 1 e o código da região. |
| **sem chave** | O `.env` está vazio ou o servidor não foi reiniciado. |

A checagem da chave usa o serviço de token do Azure e **não gasta** os minutos do plano gratuito.

> As variáveis **não** têm o prefixo `VITE_` de propósito: variáveis `VITE_*` são embutidas no JavaScript público.
> Se a chave vazar (por exemplo, colada num chat ou num print), gere outra em **Keys and Endpoint → Regenerate Key 1** e atualize o `.env` e a Netlify.

### 3. Colar a chave na Netlify
Veja a seção de deploy abaixo (passo 3).

### Como a nota se comporta no uso real
Sem a chave, ou com qualquer falha do Azure, o módulo **Fale e compare** continua servindo para ouvir o modelo, gravar e ver **a melodia**, que é calculada no aparelho e não depende do Azure. Só a nota por som some, com uma mensagem clara:

| Situação | O que a pessoa vê | Tenta de novo? |
|---|---|---|
| Gravação curta (< 0,5 s) ou sem voz audível | "Grave de novo…", **sem chamar o Azure** (não gasta cota) | Gravando de novo |
| Azure não reconheceu a fala (ele devolve "sucesso" com nota 0) | "Não deu pra entender a frase. Grave de novo…" em vez de "nota 0" | Gravando de novo |
| Rede lenta / Azure demorou (> 15 s no servidor, 20 s no app) | "A nota demorou demais…"; a tela continua livre | Botão **Tentar de novo** (mesma gravação) |
| Muitas notas seguidas (HTTP 429 sem cota) | "Espere alguns segundos…" | Botão **Tentar de novo** |
| Cota do F0 esgotada (5 h/mês) | "O limite gratuito do Azure deste mês acabou…" | Não: a nota fica desligada até sair da tela |
| Chave inválida ou de outra região | "A chave do Azure não foi aceita (veja o README)", avisado **antes** de gravar | Não |
| Sem chave no servidor | "A nota por som ainda não foi ligada neste app" | Não |
| Offline | "Sem internet agora…" | Quando voltar a conexão |

O resultado mostra a **nota geral** (0–100) em destaque, as notas de sons, fluidez e frase completa, e cada palavra. As palavras que valem treinar (nota < 80 ou erro apontado pelo Azure) ficam destacadas com o token `accent`. Dentro da palavra, a **sílaba** mais fraca também fica em destaque. Em fr-FR o Azure devolve as sílabas com as letras ("ca", "fé"), mas não o nome dos fonemas.

Cada nota fica salva **por palavra** no IndexedDB, na store `pronunciation_history`, com data, nota, tipo de erro, sílabas e a frase gravada. Isso permite ver a evolução depois. Ainda não há tela para esse histórico; ele entra na exportação e na importação de progresso.

---

## Deploy na Netlify

**Produção:** <https://poliglotas.netlify.app>

O deploy sai **da branch `main`**. O `netlify.toml` já traz tudo:
- build `npm run build`, pasta `dist`, funções em `netlify/functions`, Node 22;
- **cache:**
  - `sw.js`, página, manifest e seed são revalidados a cada visita (versões novas chegam logo);
  - `/assets/*` (nomes com hash) fica em cache por 1 ano, imutável;
  - ícones ficam em cache por 1 semana;
- **segurança:** CSP só com o próprio site (fontes embutidas, sem CDN), microfone liberado só para o próprio site, HSTS e `nosniff`;
- **rotas:** o app navega por hash (`#/aprender`), então não precisa de redirect de SPA. `/api/pronunciation` é a Function do Azure.

### 1. Criar o site (uma vez)
1. Em <https://app.netlify.com>: **Add new site → Import an existing project → GitHub**. Autorize o app da Netlify e escolha `workwithlucas/idiomasexpress`.
2. **Branch to deploy:** `main`. Os campos de build vêm preenchidos pelo `netlify.toml`: não mude nada.
3. **Deploy.** Opcional: em **Site configuration → Site details → Change site name**, troque o nome, ex.: `poliglotas` → `poliglotas.netlify.app`.

### 2. Chave do Azure no painel da Netlify (sem expor no código)
A chave fica **só** no painel. O navegador nunca a recebe: quem chama o Azure é a Function.

1. No site: **Site configuration → Environment variables → Add a variable → Add a single variable**.
2. Crie as duas:

   | Key | Value | Scopes |
   |---|---|---|
   | `AZURE_SPEECH_KEY` | a KEY 1 do recurso Speech | **Functions** (pode marcar só esta) |
   | `AZURE_SPEECH_REGION` | o código da região, ex.: `francecentral` | **Functions** |

   Em "Values", use **Same value for all deploy contexts**.
3. **Deploys → Trigger deploy → Deploy site.** As Functions só leem variáveis novas num deploy novo.
4. Confira no app publicado: **Ajustes → Serviço de nota** deve mostrar **configurado**. "Chave recusada" = chave ou região erradas; "sem chave" = faltou o novo deploy.

> Nunca coloque a chave no `netlify.toml`, em arquivos do repositório ou em variáveis `VITE_*`: tudo isso vira público. Se a chave vazar, gere outra no Azure (**Keys and Endpoint → Regenerate Key 1**), troque aqui e dispare um novo deploy.

### 3. Instalar no celular ("adicionar à tela inicial")
- **Android (Chrome):** abra o link → aparece **Instalar app** (ou menu ⋮ → *Instalar app*). O ícone é o Logomark sobre fundo claro, recortado pelo formato do aparelho.
- **iPhone (Safari):** abra o link **no Safari** (não no Chrome do iPhone) → botão **Compartilhar** → **Adicionar à Tela de Início** → *Adicionar*. Abra pelo ícone: o app ocupa a tela toda, sem a barra do Safari.

### 4. Roteiro de teste no celular (5 minutos)
1. **Online:** abra pelo ícone → escolha o perfil → faça 3 passos da sessão de hoje → **Fale e compare**: grave uma frase → a melodia aparece → **Ver nota da pronúncia** → nota geral.
2. **Offline:** ative o modo avião → feche e reabra o app pelo ícone. Ele abre, a sessão continua e a melodia funciona. A nota avisa "Sem internet agora…".
3. **Volta da rede:** desative o modo avião → a nota volta a funcionar.
4. **iPhone:** o primeiro áudio de cada sessão precisa de um toque (regra do iOS; veja Known issues).

Deploy por linha de comando (opcional): `npx netlify-cli deploy --build --prod`.

---

## Progresso e sincronização entre aparelhos

Tudo fica no **IndexedDB** do navegador, sem servidor de dados. Cada `ReviewState` é gravado com o `user_id` do perfil.

Para levar o progresso para outro aparelho: **Ajustes → Exportar progresso** (baixa um JSON com os dois perfis) e, no outro aparelho, **Importar**. A importação **mescla**: se a mesma palavra do mesmo perfil existir nos dois lados, vence a revisada mais recentemente. Dá para ir e voltar sem perder nada.

> O progresso fica ligado ao navegador. Limpar os dados do site apaga o progresso: exporte de vez em quando como backup. O app pede ao navegador armazenamento persistente (`navigator.storage.persist()`), mas no iPhone a proteção de verdade é **instalar na tela inicial** (veja "Known issues").

---

## Testar a revisão espaçada sem esperar

**Ajustes → Para testar → +1 dia** avança a data do app (fica um aviso amarelo no topo enquanto estiver ativo). "Voltar à data real" desfaz. O teste E2E usa isso para conferir que, depois de uma sessão, as palavras esquecidas ("Não lembrei") voltam no dia seguinte, as lembradas ("Lembrei") uns dias depois e as "Fácil" só depois de ~10 dias, exatamente como o FSRS agendou.

---

## Conteúdo (seed)

O conteúdo é escrito em `scripts/seed/` e compilado por `scripts/build-seed.mjs` em `public/seed/seed.json`. O app carrega esse JSON no primeiro uso e popula o IndexedDB. O build **falha** se houver referência quebrada, palavra duplicada, número errado de palavras no núcleo, gancho de memória em palavra cognata etc.

- `words-core.mjs` e `words-core-2.mjs`: as **800 palavras mais frequentes do francês falado** (1–300 e 301–800), em ordem aproximada de frequência. A curadoria se baseia em listas de corpora de fala e legendas, como Lexique 3/OpenSubtitles, com as conjugações agrupadas no infinitivo. Cada palavra tem tradução, IPA, tema e, quando se aplica, regra de cognato **ou** gancho de memória. Palavras que já existiam no complemento e caem na faixa 301–800 foram movidas para o núcleo sem mudança: o id vem do francês, então o progresso de revisão delas continua valendo.
- `words-extra.mjs`: 356 palavras complementares (ranks 801+, na ordem de utilidade, não do corpus). Servem de exemplo para cognatos, pares mínimos e falsos cognatos, e cobrem o vocabulário das cenas de Luxemburgo (CSA, matricule, domiciliation, CDI, consigne, syndic…).
- `content.mjs`: o resto do conteúdo, com o build conferindo os mínimos.
  - **35 regras de cognatos:** cada uma com pelo menos 5 exemplos, 3 para descobrir e 2 ou mais para aplicar.
  - **16 falsos cognatos.**
  - **34 pares mínimos:** vogais, vogais nasais e consoante final muda em palavra isolada. Liaison fica só nos moldes.
  - **35 regras de leitura.** O campo `sound` é uma descrição em português simples ("\"ô\"", "\"i\" com biquinho"), porque a interface não mostra transcrição fonética. O IPA continua nos dados das palavras.
  - **80 moldes de frase**, incluindo os 10 de ligação (`f_lia_*`).
  - **9 cenas:** "Dia a dia" + 8 da vida em Luxemburgo (`sc_lu_*`), cada uma com pelo menos 15 palavras e 5 moldes próprios.
  - **Os 2 perfis.**

Os testes do seed (`tests/unit/seed.test.ts`) conferem ainda que:
- o 1º exemplo de cada regra de cognato tem uma mudança para o usuário tocar;
- nenhum molde preenchido quebra a elisão (ex.: "ce antibiotique");
- nenhum par mínimo se repete.

Para mudar o conteúdo: edite esses arquivos, aumente `SEED_VERSION` em `build-seed.mjs` e rode `npm run seed`. Na próxima abertura, o app atualiza as tabelas de conteúdo **sem apagar o progresso**.

### Sobre o áudio (`audio_generated`)
O TTS é a Web Speech API do próprio aparelho. Ela não entrega o áudio gerado, então não há arquivo para guardar em cache. Na v1, `audio_generated` marca que a palavra já foi sintetizada com sucesso neste aparelho. O campo está pronto para uma v2 que salve áudio de um TTS em nuvem. A qualidade da voz depende do sistema: iOS e macOS têm vozes francesas muito boas (instale uma voz "Aprimorada" em Ajustes → Acessibilidade → Conteúdo Falado). No Android, instale os dados de voz em francês do Google TTS para ter áudio offline. A voz pode ser escolhida em **Ajustes → Voz em francês**.

---

## Estrutura

```
├── index.html
├── netlify.toml                  # build + função + cabeçalhos
├── netlify/functions/pronunciation.mts   # /api/pronunciation em produção
├── server/pronunciation.ts       # proxy do Azure (compartilhado dev/prod)
├── scripts/
│   ├── build-seed.mjs            # valida e gera public/seed/seed.json
│   ├── generate-icons.mjs
│   └── seed/                     # conteúdo-fonte (palavras, regras, cenas…)
├── public/                       # ícones, favicon, seed.json
├── src/
│   ├── main.ts                   # boot: IndexedDB → seed → rotas → service worker
│   ├── db/
│   │   ├── schema.ts             # tipos (Word, CognateRule, ReviewState…)
│   │   ├── database.ts           # stores/índices IndexedDB + população pelo seed
│   │   └── repo.ts               # consultas: conteúdo, revisão, atividade
│   ├── lib/                      # fsrs, tts (vozes), gravação, WAV, pitch, prosódia, liaison,
│   │                             #   sessão diária, Azure, export/import, relógio, sons
│   ├── exercises/                # exercícios reutilizáveis (sessão e módulos usam os mesmos)
│   ├── ui/                       # hyperscript, roteador por hash, layout, componentes, gráfico
│   ├── views/                    # sessão, hoje, um módulo por tela, perfil, ajustes
│   └── styles/main.css           # design system (claro/escuro, mobile-first)
└── tests/
    ├── unit/                     # vitest: seed, FSRS, pitch, prosódia, liaison, sessão…
    ├── e2e/                      # playwright: sessão completa, módulos, offline, falhas
    └── fixtures/voz-sintetica.wav  # "voz" do microfone falso (scripts/make-voice-fixture.mjs)
```

## Verificação de qualidade (QA)

Última passada: build de produção (`vite preview`) no Chromium 141, emulando celulares, com um microfone falso tocando uma voz sintética (`tests/fixtures/voz-sintetica.wav`).

| Verificação | Como foi feita | Resultado |
|---|---|---|
| Sessão diária do zero | IndexedDB limpo → seed → perfil → 16 passos respondidos | 16 passos, 8 de revisão, 5 tipos, **0 repetições seguidas**, **0 erros/avisos no console** |
| `reps` persiste | Lido do IndexedDB, página fechada e reaberta; e no dia seguinte a mesma palavra volta em modo "produzir" | Idêntico; alterna reconhecer/produzir |
| Melodia independente do Azure | Azure sem chave, com erro 500, respondendo OK e offline | O gráfico aparece nos 4 casos; a nota falha com uma mensagem calma, sem travar |
| Melodia offline | Rede desligada, service worker ativo | Gráfico e dicas aparecem; 0 recursos faltando |
| Detector de pitch | Sinais sintéticos de 90 a 320 Hz, 48 kHz, subida contínua, ruído, silêncio | Erro < 2%; ruído e silêncio não viram "voz" |
| Vozes variadas | Duas vozes francesas simuladas | As rodadas alternam Amélie / Thomas; com uma voz só, variam altura e velocidade |
| Descoberta antes da regra | E2E confere que a regra **não** está na tela antes da tentativa | ✔ |
| Ligação (liaison) | Unitário (moldes ≥ 10, casos com e sem ligação, h aspirado) + E2E em "C'est un ami." | ✔ |
| IndexedDB vazio/corrompido, microfone negado, sem voz francesa | `tests/e2e/robustness.spec.ts` (10 cenários) | Recupera ou avisa, sem travar |
| FSRS | Unitário + E2E com avanço de data: "Fácil" (~10 d) × "Não lembrei" (mesmo dia) | ✔ |
| Responsividade | 280 px (Galaxy Fold), 412, paisagem; todas as telas e estados novos | 0 overflow |
| Acessibilidade | axe-core em todas as telas e estados, claro e escuro | 0 violações (com o `accent` claro #B54A2B, item 21) |
| **Lighthouse 13.5 em produção** (mobile, <https://poliglotas.netlify.app>, 3 rodadas) | Rede real, throttling padrão do Lighthouse | **Performance 92–93**, Acessibilidade 100, Boas práticas 100, SEO 100 · LCP 2,7–2,9 s, TBT 50–60 ms, CLS 0 |
| **Lighthouse 11.7.1 em produção** (último com a categoria PWA) | Mesma URL | **PWA 100**: manifest instalável, service worker, splash, tema, ícone maskable |
| **Produção de ponta a ponta** | Chromium pela rede real, contra o site publicado | Instalável sem impedimentos; sessão diária; nota real da Azure pela Function (94, em 1,7 s) com melodia e histórico; offline (fechar e reabrir): todas as telas, sessão e melodia; volta da rede: nota de novo; 0 erros |
| **API pública protegida** | `curl` e outro site chamando `/api/pronunciation` | 403, sem chamar o Azure (não gasta cota) |
| Azure real (chave em `francecentral`) | App no navegador → MediaRecorder → WAV → proxy → Azure, com fala francesa (espeak-ng). Depois com o `.env` vazio e com chave errada | Nota real em ~1,4 s (94 na frase certa; 77, com "croissant" marcado "faltou", numa frase trocada), melodia junto e histórico salvo. Sem chave e com chave errada: mensagem clara, melodia funcionando, 0 erros |
| Seed v3 (800 palavras) | Build v2 com progresso real (sessão completa) → mesma origem com o build v3 | Progresso idêntico (reps por palavra), 8 cenas novas, nova sessão intercalada completa, 0 erros |
| Estabilidade dos testes | 47 unitários; 15 E2E × 3 repetições (e × 2 após o último ajuste) | 47/47 · 45/45 · 30/30 |

## Known issues

Limitações conhecidas que **não** foram corrigidas nesta versão, com o motivo:

1. **Não testado em celular físico** (produção validada no Chromium pela rede real; veja o roteiro em "Deploy na Netlify → 4"). O ambiente de QA só tinha Chromium; iPhone/Safari (WebKit) e Android real foram emulados (tamanho de tela, toque, DPR), não executados. *Por quê:* não havia aparelho nem WebKit disponível. **Conferir manualmente no primeiro uso:** voz francesa no iPhone e no Android, pedido de permissão do microfone, gravação + avaliação do Azure no Safari (que grava em MP4/AAC, convertido para WAV pela Web Audio API) e instalação na tela inicial.
2. **iPhone: o áudio automático da Revisão pode não tocar no primeiro cartão.** O Safari só libera a síntese de voz depois de um toque do usuário. Tocar no botão de áudio uma vez resolve para o resto da sessão. *Por quê:* é uma política do iOS e não dá para contornar.
3. **A qualidade e a lista de vozes dependem do aparelho.** Ajustes mostra as vozes francesas do aparelho e explica cada situação: procurando, nenhuma voz listada pelo navegador, vozes sem francês ou lista pronta. A lista é relida por alguns segundos, porque o Safari/iOS às vezes não avisa quando as vozes carregam. Nos testes deste repositório o Chromium de automação não expõe **nenhuma** voz (mesmo com espeak-ng/speech-dispatcher instalados), por isso as vozes são simuladas. Em celular e desktop reais a lista vem do sistema.
    A Web Speech API usa as vozes instaladas no sistema. Se não houver voz francesa, o app **desativa o áudio e avisa** (em vez de ler francês com sotaque de outra língua); Ajustes explica como instalar a voz. Em navegadores que não informam lista de vozes (alguns WebViews), o app pede `fr-FR` pelo atributo `lang`, e é o sistema que escolhe. *Por quê:* não há TTS embutido offline na v1 (seria um novo recurso, com Azure TTS ou arquivos de áudio).
4. **`audio_generated` não guarda áudio.** A Web Speech API não entrega o áudio sintetizado. O campo marca só que a palavra já foi falada com sucesso naquele aparelho. *Por quê:* limitação da API (veja "Sobre o áudio").
5. **A primeira abertura precisa de internet.** O app e o seed (~230 KB, ~52 KB comprimido) só ficam disponíveis offline depois de baixados uma vez. Sem rede na primeira visita, o navegador mostra a própria página de erro. *Por quê:* é o funcionamento normal de um PWA; não há como servir algo antes de o service worker existir.
6. **A avaliação de pronúncia precisa de internet e de chave.** Offline ou sem chave, o módulo 6 continua servindo para ouvir, gravar e comparar, mas sem nota.
    - **Teste real:** foi feito com uma chave real (região `francecentral`) e fala francesa sintetizada pelo espeak-ng. Os testes automáticos continuam usando respostas simuladas, para não gastar a cota nem depender de rede.
    - **Cota esgotada:** o formato real da resposta **não pôde ser provocado** (exigiria gastar as 5 h do mês). O app reconhece 429, e 403 ou 429 com "quota" no texto, que é o que a documentação da Microsoft descreve.
7. **iPhone sem instalar: o progresso pode ser apagado depois de 7 dias sem uso.** O Safari limpa o armazenamento de sites que não são abertos por 7 dias, a menos que o app esteja **na tela inicial**. O app pede armazenamento persistente, mas o Safari não garante. *Por quê:* é uma política do WebKit. **Instale na tela inicial e exporte o progresso de vez em quando.**
8. **Os intervalos longos do FSRS variam um pouco.** Intervalos a partir de ~2,5 dias recebem um "fuzz" aleatório (ex.: "Fácil" numa palavra nova = 8–12 dias). *Por quê:* é intencional no FSRS, para as revisões não se acumularem no mesmo dia.
9. **O limite de "palavras novas por dia" inclui as adicionadas manualmente** (botão de marcador nos módulos). *Por quê:* comportamento definido na v1 (o limite vale para o total de palavras que entram no dia); mudar seria mudança de regra, não correção.
10. **Duas abas abertas ao mesmo tempo** compartilham o progresso, mas os contadores (badge de revisão, tela Hoje) de uma aba só se atualizam ao navegar nela. *Por quê:* sincronização entre abas seria funcionalidade nova. O uso previsto é o app instalado, com uma janela só.
11. **Paisagem:** no navegador a tela fica compacta mas utilizável. O app instalado abre travado em retrato (`orientation: portrait` no manifest), que é o uso principal.
12. **Um só pacote de JavaScript (~115 KB, 40 KB gzip).** O Lighthouse aponta ~22 KB não usados na primeira tela. *Por quê:* dividir o código por módulo traria complexidade para ganho desprezível (Performance já em 99–100, e tudo vem do cache depois da primeira visita).
13. **O Lighthouse atual (12+) não tem mais a categoria "PWA".** A nota de PWA acima usa o Lighthouse 11.7.1, a última versão que a mede. A instalabilidade também foi confirmada direto no Chrome.
14. **A melodia "francês" é modelada, não extraída da voz nativa.** A Web Speech API não entrega o áudio que sintetiza, então o pitch da voz nativa não pode ser medido no navegador. O que é medido de verdade é **a sua voz** (autocorrelação, ao vivo). A meta segue as regras de entonação do francês, e o **ritmo** dela usa os tempos reais da voz nativa quando o aparelho informa o início das palavras. *Por quê:* extrair da voz nativa exige áudio gravado (ex.: Azure TTS ou arquivos), o que mexe na integração com o Azure e no esquema de dados, e esta etapa proibia os dois. O extrator já aceita qualquer áudio, então é só ligar quando houver.
15. **O detector de pitch foi validado com sinais sintéticos e o microfone falso do Chromium, não com vozes humanas reais.** Com AGC e cancelamento de eco do celular ligados, vozes muito graves (< 70 Hz) ou sussurradas saem como "não deu pra ouvir". *Por quê:* não havia gravações humanas neste ambiente. Confira com a sua voz nas primeiras sessões.
16. **As dicas de melodia são deliberadamente simples** (direção da voz no fim e ritmo geral). A contagem de sílabas é aproximada, pela escrita, então frases com muitos "e" mudos podem ficar com a meta um pouco mais longa. *Por quê:* dicas curtas e sem jargão eram o objetivo. Uma análise fina por sílaba precisaria de áudio nativo (item 14).
17. **A sessão diária fica salva por aparelho** (`localStorage`). No celular da Eduarda e no do Lucas, cada um tem a sua; exportar/importar leva o progresso, não a sessão em andamento. *Por quê:* guardar a sessão no banco mudaria o esquema de dados, o que esta etapa não permitia.
18. **Descobrir uma regra adiciona os exemplos dela à revisão**, e isso conta no limite de palavras novas do dia (item 9). Num dia com muitas descobertas, a metade de revisão da sessão seguinte vem cheia de vencidas. *Por quê:* é o comportamento esperado (o que foi descoberto precisa ser revisto), mas vale saber.
19. **"Fale você" dentro de Monte a frase é pulável**, e na sessão isso acontece em 2 dos 16 passos. Quem pular sempre não vê a própria melodia na sessão (continua disponível em "Fale e compare"). *Por quê:* obrigar gravação trava quem estuda no ônibus ou sem microfone.
20. **O IPA não aparece mais na interface** (pedido de leveza: zero termo técnico). A pronúncia vem do áudio e das descrições em português. O IPA continua nos dados, para uso futuro.
21. **O `accent` do tema claro foi escurecido de #F1704E para #B54A2B** (mesmo tom coral do #C4502F sugerido, só mais escuro), e o design system publicado recebeu o mesmo valor. Os pares medidos no tema claro:
    - Texto branco do botão primário sobre `accent`: **5,28:1**.
    - Contador "0/16" em `accent` sobre `surface-soft`: **4,52:1**.
    - O #C4502F passaria no botão (4,63:1), mas não no contador (3,96:1).
    - O tema escuro continua com #FF8B65 (7,0:1 e 5,94:1).
    - O axe dá 0 violações nos dois temas. A folga no contador é pequena: se `surface-soft` ou o `accent` do tema claro mudarem, meça de novo.
22. **Pontos em que a spec não tinha valor e foi preciso escolher um token existente:**
    - **Palavra/frase em destaque nos exercícios:** usa o estilo `title` (22/28 Bricolage). A spec reserva a display para o nome e os títulos de tela, e não tem tamanho maior de Inter.
    - **Ícones utilitários** (tocar áudio, fechar, setas, cenas): desenhados seguindo a regra de "ícone novo" (24×24, traço 1,75, sem preenchimento).
    - **Gráfico de melodia:** meta em `ink-soft` tracejado, sua voz em `primary`.
    - **Resultados "quase" e "tente de novo":** `ink-soft` sobre `surface-soft`, sem vermelho nem verde.
    - **Botão de gravar:** fundo `accent`.
23. **Conteúdo v3: o que foi escolhido na curadoria.**
    - **Ordem das palavras 301–800:** é aproximada, como a das 300 primeiras. A lista foi montada de memória a partir das listas de frequência de fala, sem acesso a um corpus neste ambiente.
    - **Pronúncia (IPA):** revisada à mão, sem um falante nativo.
    - **Cenas antigas:** as 6 genéricas (creche, banco, entrevista, médico, mercado, commune) foram substituídas pelas versões de Luxemburgo, que reaproveitam todas as palavras e moldes delas. Manter as duas versões deixaria dois cards "Banco" na tela. Um link salvo para uma cena antiga (ex.: `#/situacoes/sc_creche`) mostra "Situação não encontrada".
    - **Ícones das cenas Transporte e Vizinhança:** usam o pino e a pessoa, já existentes. Desenhar ícones novos seria mudança de interface, fora do escopo desta etapa.
24. **O histórico de pronúncia ainda não tem tela.** Os dados já são gravados por palavra (`pronunciation_history`) e vão junto na exportação de progresso. A tela de evolução fica para uma próxima etapa.
25. **Frases fora do banco não entram no histórico.** Numa frase, só as palavras que existem no banco ganham registro. Palavras que não estão no banco (ex.: "croissant") aparecem na nota, mas não no histórico.
26. **O selo da Netlify é bloqueado de propósito.** A Netlify injeta no site publicado um selo/barra próprio (`/.netlify/scripts/hud`), fora do Design System e bloqueado pela CSP. O `index.html` traz um marcador (`#nl-badge-frame`) que faz esse script desistir, e o CSS esconde o selo como reserva. Para desligá-lo na origem: no painel da Netlify, nas opções de colaboração/toolbar do site.
27. **O branch de produção da Netlify ainda é `claude/pensive-keller-1e2l48`.** Trocar para `main` pela API exige alterar a configuração do site, o que não foi feito daqui. Enquanto isso, cada commit da `main` é enviado também para esse branch, e a produção reflete a `main`. Para trocar: *Site configuration → Build & deploy → Branches and deploy contexts → Production branch = `main`*.
28. **Limite por IP da API é de melhor esforço.** Cada instância da Function guarda a própria contagem. Contra abuso sério, o teto real é a cota do F0, que não gera cobrança.

## Fora do escopo da v1 (de propósito)
Nenhuma IA generalista, nenhuma conversa livre, nenhuma sincronização automática e nenhum login. A escolha de perfil é local.
