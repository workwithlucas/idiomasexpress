# Relatório: a experiência dos Momentos

Produção: <https://poliglotas.netlify.app> · branch `main`

## O que mudou

- **Um caminho só.** Três abas (Hoje, Caderno, Como funciona); Ajustes pelo avatar. Saíram a grade Aprender, a aba Revisar, a sessão antiga e as oito telas avulsas. Os motores ficaram: viraram passos do Momento e práticas do Como funciona.
- **37 Momentos em 9 capítulos**, cada um com arco fixo de 6 passos (Escute, Você já sabe, A chave, Monte, Fale, Leve com você) e uma chave diferente. O Momento 1 é o do protótipo.
- **Reencontros**: FSRS e `reps` iguais; até 8 por dia antes do Momento, alternando reconhecer e produzir; o resto em "Revisar mais", no Caderno.
- **Dados**: banco v3 (`chapters`, `momentos`, `momento_progress`), conteúdo v5. Quem já usava mantém ReviewState, reps e histórico de pronúncia. Sincronização e exportar/importar levam `momento_progress`.

## Fases

| Fase | Commit | Conteúdo |
|---|---|---|
| A | `bb324e3` | Navegação, Momento completo, Hoje, Caderno, Como funciona (13 capítulos), migração v5, sincronização, Momento 1 |
| B | `48464e1` | Momentos 2 a 13 (capítulos 1 a 3) |
| C | `4a37201` | Momentos 14 a 37 (capítulos 4 a 9), relatório |

## Verificação

| O quê | Resultado |
|---|---|
| Testes unitários (vitest) | 81 passando: seed e currículo, Momentos, reencontros, migração v2 → v3 preservando ReviewState e reps, sincronização de `momento_progress`, FSRS, pitch, Azure |
| Ponta a ponta (Playwright, build de produção) | 27 passando: Momento 1 completo, reencontros no dia seguinte alternando a direção, pular reencontros, par mínimo, Momento inteiro offline, sincronização entre dois aparelhos, falhas da Azure e do microfone, a trilha inteira com os 37 Momentos |
| Acessibilidade (axe-core, WCAG 2.1 AA) | 0 violações em todas as telas e em cada passo do Momento, tema claro e escuro |
| Lighthouse 13.5 em produção (celular, 3 rodadas) | Performance 91, 91 e 93 · Acessibilidade 100 · Boas práticas 100 · SEO 100 · LCP 2,9–3,1 s · CLS 0 |
| Lighthouse 11.7.1 em produção (último com a categoria PWA) | PWA 100 |
| Azure nos testes | Sempre simulada; nenhum teste usa a chave real |

## Prints (produção, perfil novo)

| Tela | Claro | Escuro |
|---|---|---|
| Hoje antes do Momento 1 | [light-01](prints/light-01-hoje-antes.png) | [dark-01](prints/dark-01-hoje-antes.png) |
| Passo 2 aceso ("14 de 17") | [light-03](prints/light-03-voce-ja-sabe.png) | [dark-03](prints/dark-03-voce-ja-sabe.png) |
| Passo 3, a chave | [light-04](prints/light-04-chave.png) | |
| Hoje depois do Momento 1 | [light-08](prints/light-08-hoje-depois.png) | [dark-08](prints/dark-08-hoje-depois.png) |
| Caderno | [light-09](prints/light-09-caderno.png) | |
| Como funciona, capítulo 2 | [light-11](prints/light-11-capitulo-2.png) | [dark-11](prints/dark-11-capitulo-2.png) |

## Listas

A lista dos 37 Momentos (título, can_do, chave) e a de todas as pontes, com o tipo e a justificativa das de origem, estão em [conteudo.md](conteudo.md), gerado dos dados por `node scripts/dev/report.mjs`.
