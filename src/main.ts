import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import './styles/main.css';

import { registerSW } from 'virtual:pwa-register';
import { ensureSeeded, getDB } from './db/database';
import { listUsers, loadContent } from './db/repo';
import { h, render } from './ui/dom';
import { mountApp } from './ui/layout';
import { route } from './ui/router';
import { restoreUser } from './ui/session';
import { toast } from './ui/toast';
import { profileView } from './views/profile';
import { homeView } from './views/home';
import { learnView } from './views/learn';
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

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  try {
    await getDB();
    // Primeiro uso (ou conteúdo novo): baixa o seed JSON e popula o IndexedDB.
    await ensureSeeded(__SEED_VERSION__);
    await loadContent();
    restoreUser(await listUsers());
    mountApp(app);
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
