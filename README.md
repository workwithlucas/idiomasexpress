# Idiomas Express — Francês rumo a Luxemburgo

PWA para acelerar o francês de dois falantes de português brasileiro (perfis **Lucas** e **Eduarda**). Funciona 100% offline depois da primeira abertura e pode ser instalado na tela inicial do celular.

**Stack:** Vite + TypeScript (sem framework) · IndexedDB via [`idb`](https://github.com/jakearchibald/idb) · Web Speech API (TTS) · MediaRecorder + Azure Speech (avaliação de pronúncia) · [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (revisão espaçada) · `vite-plugin-pwa` (service worker/Workbox) · Netlify.

---

## Módulos

| # | Módulo | O que faz |
|---|--------|-----------|
| 1 | **Cognatos** | 20 regras de conversão PT→FR (‑ção→‑tion, ‑dade→‑té, ‑oso→‑eux, ‑mente→‑ment, ‑ário→‑aire, ‑vel→‑ble…), cada uma com suas palavras, tradução e áudio. Aba separada com 16 **falsos cognatos** (attendre ≠ atender, rester ≠ restar…). |
| 2 | **Regras de leitura** | 35 regras letra→som (eau = "ô", oi = "uá", consoantes finais mudas, nasais, liaison, elisão…), com 3–5 exemplos e áudio cada. |
| 3 | **Discriminação sonora** | 17 pares mínimos (jeune/jaune, vin/vent/vont, tu/tout, rue/roue, deux/des, poisson/poison…). Dois modos: "qual você ouviu?" e "qual veio primeiro?", com feedback imediato. |
| 4 | **Construtor de frases** | 30 moldes ("je veux ___", "j'ai mal à la ___"…). Escolha ou digite a palavra do slot (acentos opcionais) e ouça a frase completa para repetir. |
| 5 | **Associação de memória** | Ganchos em português para as palavras **não cognatas**, com busca e filtro por tema. Conteúdo de apoio, sem quiz. |
| 6 | **Repetição falada** | Ouça o modelo (normal ou devagar), grave sua voz, ouça sua gravação e receba nota do **Azure Pronunciation Assessment** (fr‑FR): pronúncia, precisão, fluência, completude, nota por palavra e por fonema. |
| 7 | **Revisão espaçada** | FSRS (ts-fsrs): palavras vencidas + novas do dia (padrão 10, ajustável), botões Errei/Difícil/Bom/Fácil com o próximo intervalo visível. |
| 8 | **Frases por situação** | Creche, banco, entrevista de emprego, médico, supermercado, commune e dia a dia. Reaproveita as palavras e os moldes já cadastrados. |

Também: tela **Hoje** (revisões pendentes, sequência de dias, palavra do dia, módulos praticados hoje), seleção de perfil, e **Ajustes** (voz, velocidade, limite diário, exportar/importar progresso, status do Azure, simulação de data para testes).

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

### 1. Criar o recurso no Azure
1. Em <https://portal.azure.com>, crie um recurso **Speech** (em "Azure AI services"). O plano gratuito **F0** basta para uso pessoal.
2. Escolha uma região (ex.: `westeurope` ou `francecentral`).
3. Abra o recurso → **Keys and Endpoint**. Copie **KEY 1** e a **Location/Region**.

### 2. Colar a chave para desenvolvimento local

```bash
cp .env.example .env
```

Edite o `.env` (ele está no `.gitignore` e **não é commitado**):

```env
AZURE_SPEECH_KEY=cole-a-KEY-1-aqui
AZURE_SPEECH_REGION=westeurope
```

Reinicie o `npm run dev`. Em **Ajustes → Avaliação de pronúncia** o status deve aparecer como "configurado".

> As variáveis **não** têm o prefixo `VITE_` de propósito: variáveis `VITE_*` são embutidas no JavaScript público.

### 3. Colar a chave na Netlify
Veja a seção de deploy abaixo (passo 3).

Sem a chave, o módulo 6 continua funcionando para ouvir o modelo, gravar e comparar sua voz; só a nota automática fica desativada.

---

## Deploy na Netlify

O repositório já tem o `netlify.toml` (build, pasta publicada, funções e cabeçalhos).

1. Na Netlify: **Add new site → Import an existing project** e escolha este repositório do GitHub.
2. As configurações vêm do `netlify.toml`: comando `npm run build`, pasta `dist`, funções em `netlify/functions`. Não é preciso mudar nada.
3. Em **Site configuration → Environment variables**, adicione:
   - `AZURE_SPEECH_KEY` = sua KEY 1
   - `AZURE_SPEECH_REGION` = a região (ex.: `westeurope`)
4. Faça o deploy (ou **Deploys → Trigger deploy** se o site já existia antes das variáveis).
5. Abra o site no celular:
   - **Android (Chrome):** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
   - **iPhone (Safari):** botão Compartilhar → *Adicionar à Tela de Início*.

Deploy por linha de comando (opcional): `npx netlify-cli deploy --build --prod`.

---

## Progresso e sincronização entre aparelhos

Tudo fica no **IndexedDB** do navegador, sem servidor de dados. Cada `ReviewState` é gravado com o `user_id` do perfil.

Para levar o progresso para outro aparelho: **Ajustes → Exportar progresso** (baixa um JSON com os dois perfis) e, no outro aparelho, **Importar**. A importação **mescla**: se a mesma palavra do mesmo perfil existir nos dois lados, vence a revisada mais recentemente. Dá para ir e voltar sem perder nada.

> O progresso fica ligado ao navegador. Limpar os dados do site apaga o progresso: exporte de vez em quando como backup. O app pede ao navegador armazenamento persistente (`navigator.storage.persist()`), mas no iPhone a proteção de verdade é **instalar na tela inicial** (veja "Known issues").

---

## Testar a revisão espaçada sem esperar

**Ajustes → Ferramentas de teste → +1 dia** avança a data do app (fica um aviso amarelo no topo enquanto estiver ativo). "Voltar à data real" desfaz. O teste E2E usa isso para conferir que, depois de uma sessão, as palavras esquecidas ("Errei") voltam no dia seguinte e as acertadas ("Bom") dois dias depois, exatamente como o FSRS agendou.

---

## Conteúdo (seed)

O conteúdo é escrito em `scripts/seed/` e compilado por `scripts/build-seed.mjs` em `public/seed/seed.json`. O app carrega esse JSON no primeiro uso e popula o IndexedDB. O build **falha** se houver referência quebrada, palavra duplicada, número errado de palavras no núcleo, gancho de memória em palavra cognata etc.

- `words-core.mjs`: as **300 palavras mais frequentes do francês falado**, em ordem aproximada de frequência (curadoria baseada em listas de corpora de fala e legendas, como Lexique 3/OpenSubtitles, agrupando conjugações no infinitivo). Cada palavra tem tradução, IPA, tema e, quando se aplica, regra de cognato **ou** gancho de memória.
- `words-extra.mjs`: 212 palavras complementares, necessárias para exemplos de cognatos, pares mínimos, falsos cognatos e cenas (ranks 301+, na ordem de utilidade, não do corpus).
- `content.mjs`: regras de cognatos, falsos cognatos, pares mínimos, regras de leitura, moldes de frase, cenas e perfis.

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
│   ├── lib/                      # fsrs, tts, gravação, WAV, Azure, export/import, relógio
│   ├── ui/                       # hyperscript, roteador por hash, layout, componentes
│   ├── views/                    # uma tela por módulo + hoje, perfil, ajustes
│   └── styles/main.css           # design system (claro/escuro, mobile-first)
└── tests/
    ├── unit/                     # vitest
    └── e2e/                      # playwright: fluxo completo + offline
```

## Verificação de qualidade (QA)

Última passada completa: build de produção (`vite preview`) no Chromium 141, emulando celulares.

| Verificação | Como foi feita | Resultado |
|---|---|---|
| Fluxo completo do zero | IndexedDB limpo → seed → perfil → 8 módulos → revisão → dia seguinte simulado (`tests/e2e/full-flow.spec.ts`) | ✔ |
| Erros no console | Todas as telas e interações, tema claro e escuro, online e offline | 0 erros, 0 avisos |
| IndexedDB vazio/corrompido | Tabelas de conteúdo apagadas, perfis apagados, `ReviewState` inválido/órfão, `localStorage` corrompido, banco apagado com o app aberto (`tests/e2e/robustness.spec.ts`) | Recupera sozinho (repopula conteúdo, reinicia só o estado corrompido) |
| 100% offline | Rede desligada: recarregar, abrir link direto a frio, todos os módulos, avaliar cartões | ✔, nenhum recurso faltando |
| Cache do service worker | Inspeção do Cache Storage: `index.html`, JS, CSS, fontes, ícones, manifest e `seed/seed.json` (22 entradas) | ✔; atualização de versão testada sem perda de progresso |
| TTS em francês | Listas de vozes simuladas: fr+en, só en/pt, vazia, carregamento tardio, preferência salva inválida | Sempre voz francesa; sem voz francesa **não fala** e avisa |
| Microfone | Permitido, negado (`NotAllowedError`), sem microfone, contexto HTTP inseguro, toque múltiplo, sair da tela gravando | Mensagem clara em cada caso; microfone sempre liberado; 1 só stream |
| Azure sem chave / chave inválida / API fora do ar | Servidor sem variáveis, com chave falsa, e respondendo HTML | Avisa, grava e deixa comparar sem nota; nunca trava |
| FSRS | Unitário + E2E com avanço de data: "Fácil" (~10 d, com fuzz) × "Errei" (volta no mesmo dia) | ✔ |
| Responsividade | 280 px (Galaxy Fold), 360, 375 (iPhone SE), 412, 430, paisagem e iPad: medição automática de overflow horizontal em todas as telas | 0 overflow |
| Acessibilidade | axe-core em todas as telas, claro e escuro | 0 violações |
| Lighthouse 13.5 (mobile) | Primeira visita e tela "Hoje" com perfil | Performance 99 / 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100 |
| Lighthouse 11.7.1 (último com a categoria PWA) | Primeira visita | PWA 100 · instalável (0 erros de instalabilidade no Chrome) |

## Known issues

Limitações conhecidas que **não** foram corrigidas nesta versão, com o motivo:

1. **Não testado em celular físico.** O ambiente de QA só tinha Chromium; iPhone/Safari (WebKit) e Android real foram emulados (tamanho de tela, toque, DPR), não executados. *Por quê:* não havia aparelho nem WebKit disponível. **Conferir manualmente no primeiro uso:** voz francesa no iPhone e no Android, pedido de permissão do microfone, gravação + avaliação do Azure no Safari (que grava em MP4/AAC, convertido para WAV pela Web Audio API) e instalação na tela inicial.
2. **iPhone: o áudio automático da Revisão pode não tocar no primeiro cartão.** O Safari só libera a síntese de voz depois de um toque do usuário. Tocar no botão de áudio uma vez resolve para o resto da sessão. *Por quê:* é uma política do iOS e não dá para contornar.
3. **A qualidade da voz depende do aparelho.** A Web Speech API usa as vozes instaladas no sistema. Se não houver voz francesa, o app **desativa o áudio e avisa** (em vez de ler francês com sotaque de outra língua); Ajustes explica como instalar a voz. Em navegadores que não informam lista de vozes (alguns WebViews), o app pede `fr-FR` pelo atributo `lang`, e é o sistema que escolhe. *Por quê:* não há TTS embutido offline na v1 (seria um novo recurso, com Azure TTS ou arquivos de áudio).
4. **`audio_generated` não guarda áudio.** A Web Speech API não entrega o áudio sintetizado. O campo marca só que a palavra já foi falada com sucesso naquele aparelho. *Por quê:* limitação da API (veja "Sobre o áudio").
5. **A primeira abertura precisa de internet.** O app e o seed (~110 KB) só ficam disponíveis offline depois de baixados uma vez. Sem rede na primeira visita, o navegador mostra a própria página de erro. *Por quê:* é o funcionamento normal de um PWA; não há como servir algo antes de o service worker existir.
6. **A avaliação de pronúncia precisa de internet e de chave.** Offline ou sem chave, o módulo 6 continua servindo para ouvir, gravar e comparar, mas sem nota. A chamada real ao Azure **não foi executada nesta passada** (não havia chave): os testes usam uma resposta simulada com o formato documentado pela Microsoft, e o proxy foi testado com chave inválida (erro tratado). *Por quê:* a chave é pessoal. Confira com a sua na primeira gravação.
7. **iPhone sem instalar: o progresso pode ser apagado depois de 7 dias sem uso.** O Safari limpa o armazenamento de sites que não são abertos por 7 dias, a menos que o app esteja **na tela inicial**. O app pede armazenamento persistente, mas o Safari não garante. *Por quê:* é uma política do WebKit. **Instale na tela inicial e exporte o progresso de vez em quando.**
8. **Os intervalos longos do FSRS variam um pouco.** Intervalos a partir de ~2,5 dias recebem um "fuzz" aleatório (ex.: "Fácil" numa palavra nova = 8–12 dias). *Por quê:* é intencional no FSRS, para as revisões não se acumularem no mesmo dia.
9. **O limite de "palavras novas por dia" inclui as adicionadas manualmente** (botão de marcador nos módulos). *Por quê:* comportamento definido na v1 (o limite vale para o total de palavras que entram no dia); mudar seria mudança de regra, não correção.
10. **Duas abas abertas ao mesmo tempo** compartilham o progresso, mas os contadores (badge de revisão, tela Hoje) de uma aba só se atualizam ao navegar nela. *Por quê:* sincronização entre abas seria funcionalidade nova. O uso previsto é o app instalado, com uma janela só.
11. **Paisagem:** no navegador a tela fica compacta mas utilizável. O app instalado abre travado em retrato (`orientation: portrait` no manifest), que é o uso principal.
12. **Um só pacote de JavaScript (~90 KB, 31 KB gzip).** O Lighthouse aponta ~22 KB não usados na primeira tela. *Por quê:* dividir o código por módulo traria complexidade para ganho desprezível (Performance já em 99–100, e tudo vem do cache depois da primeira visita).
13. **O Lighthouse atual (12+) não tem mais a categoria "PWA".** A nota de PWA acima usa o Lighthouse 11.7.1, a última versão que a mede. A instalabilidade também foi confirmada direto no Chrome.

## Fora do escopo da v1 (de propósito)
Nenhuma IA generalista, nenhuma conversa livre, nenhuma sincronização automática e nenhum login. A escolha de perfil é local.
