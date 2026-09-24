// Fontes do design system, embutidas no build para funcionar offline.
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/main.css';

import { registerSW } from 'virtual:pwa-register';
import { ensureSeeded, getDB } from './db/database';
import { listUsers, loadContent, repairReviewStates } from './db/repo';
import { h, render } from './ui/dom';
import { mountApp } from './ui/layout';
import { route } from './ui/router';
import { restoreUser } from './ui/session';
import { toast } from './ui/toast';
import type { TtsProblem } from './lib/tts';
import { profileView } from './views/profile';
import { homeView } from './views/home';
import { learnView } from './views/learn';
import { sessionView } from './views/session';
import { cognatesView } from './views/cognates';
import { readingView } from './views/reading';
import { listeningView } from './views/listening';
import { builderView } from './views/builder';
import { memoryView } from './views/memory';
import { speakingView } from './views/speaking';
import { reviewView } from './views/review';
import { sceneDetailView, scenesView } from './views/scenes';
import { settingsView } from './views/settings';

route('/', homeView);
route('/perfil', profileView);
route('/aprender', learnView);
route('/sessao', sessionView);
route('/cognatos', cognatesView);
route('/leitura', readingView);
route('/escuta', listeningView);
route('/frases', builderView);
route('/memoria', memoryView);
route('/fala', speakingView);
route('/revisao', reviewView);
route('/situacoes', scenesView);
route('/situacoes/:id', sceneDetailView);
route('/ajustes', settingsView);

// Aviso único (a cada 20 s no máximo) quando não há voz francesa para falar.
let lastTtsWarning = 0;
window.addEventListener('tts-problem', (e) => {
  if (Date.now() - lastTtsWarning < 20_000) return;
  lastTtsWarning = Date.now();
  const problem = (e as CustomEvent<TtsProblem>).detail;
  toast(
    problem === 'unsupported'
      ? 'Este navegador não tem síntese de voz. Use Chrome, Edge ou Safari atualizados.'
      : 'Nenhuma voz em francês instalada neste aparelho. Instale uma nas configurações de voz/Texto para fala do sistema (veja Ajustes).',
    'error',
    undefined,
    7000,
  );
});

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  try {
    await getDB();
    // Primeiro uso (ou conteúdo novo): baixa o seed JSON e popula o IndexedDB.
    await ensureSeeded(__SEED_VERSION__);
    await loadContent();
    const repaired = await repairReviewStates();
    if (repaired) console.warn(`${repaired} estado(s) de revisão corrompido(s) foram reiniciados.`);
    restoreUser(await listUsers());
    mountApp(app);
    // Pede armazenamento persistente para o navegador não despejar o IndexedDB
    // (progresso) sob pouco espaço. Chrome concede para sites instalados/usados;
    // no Safari a proteção real vem de instalar na tela inicial (ver README).
    void navigator.storage?.persist?.().catch(() => false);
  } catch (e) {
    console.error(e);
    render(
      app,
      h(
        'div',
        { class: 'boot boot--error' },
        h('div', { class: 'boot__mark' }, '!'),
        h('h1', null, 'Não foi possível iniciar'),
        h('p', null, (e as Error).message),
        h('p', { class: 'muted' }, 'Verifique se o navegador permite armazenamento local (IndexedDB) e se não está em modo privado. Na primeira abertura é preciso estar online.'),
        h('button', { class: 'btn btn--primary', onclick: () => location.reload() }, 'Tentar de novo'),
      ),
    );
    return;
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const updateSW = registerSW({
      onNeedRefresh() {
        toast('Nova versão disponível.', 'info', { label: 'Atualizar', run: () => void updateSW(true) }, 0);
      },
      onOfflineReady() {
        toast('Pronto para usar offline.', 'success');
      },
    });
  }
}

void boot();
