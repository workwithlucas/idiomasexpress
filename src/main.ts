// Fontes do design system, embutidas no build para funcionar offline.
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/main.css';

import { getSyncCode, syncNow } from './lib/sync';
import { registerSW } from 'virtual:pwa-register';
import { ensureSeeded, getDB } from './db/database';
import { listUsers, loadContent, repairReviewStates } from './db/repo';
import { h, render } from './ui/dom';
import { mountApp } from './ui/layout';
import { navigate, parseHash, route } from './ui/router';
import { restoreUser } from './ui/user';
import { toast } from './ui/toast';
import type { TtsProblem } from './lib/tts';
import { profileView } from './views/profile';
import { hojeView } from './views/hoje';
import { momentoView } from './views/momento';
import { cadernoView } from './views/caderno';
import { guideChapterView, guideView } from './views/guide';
import { settingsView } from './views/settings';

route('/', hojeView);
route('/perfil', profileView);
route('/momento/:id', momentoView);
route('/reencontros', momentoView);
route('/caderno', cadernoView);
route('/como-funciona', guideView);
route('/como-funciona/:n', guideChapterView);
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
    await ensureSeeded(__SEED_VERSION__, undefined, __SEED_HASH__);
    await loadContent();
    const repaired = await repairReviewStates();
    if (repaired) console.warn(`${repaired} estado(s) de revisão corrompido(s) foram reiniciados.`);
    restoreUser(await listUsers());
    mountApp(app);
    startAutoSync();
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
        h('p', { class: 'soft' }, 'Verifique se o navegador permite armazenamento local (IndexedDB) e se não está em modo privado. Na primeira abertura é preciso estar online.'),
        h('button', { class: 'btn', onclick: () => location.reload() }, 'Tentar de novo'),
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

/**
 * Sincronização automática (se houver código de casal): ao abrir o app e ao
 * voltar para ele (no celular, "abrir" costuma só retomar a página). Nunca
 * bloqueia nada: sem rede ou com erro, fica para a próxima vez.
 */
function startAutoSync(): void {
  let last = 0;
  const run = async () => {
    if (!navigator.onLine || Date.now() - last < 2 * 60_000) return;
    last = Date.now();
    try {
      if (!(await getSyncCode())) return;
      const r = await syncNow();
      if (r.updated) {
        // Só redesenha Hoje e Caderno (não interrompe um Momento em andamento).
        if (['/', '/caderno'].includes(parseHash().path)) navigate(parseHash().path);
      }
    } catch (e) {
      console.info('Sincronização adiada:', (e as Error).message);
    }
  };
  void run();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void run();
  });
}

void boot();
