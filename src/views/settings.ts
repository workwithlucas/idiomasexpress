import { selectWrap } from '../ui/components';
import { describeSyncError, generateSyncCode, getLastSync, getSyncCode, setSyncCode, SyncError, syncNow } from '../lib/sync';
import { h, render } from '../ui/dom';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { content, loadContent } from '../db/repo';
import { getMeta } from '../db/database';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { ensureVoices, frenchVoices, onVoicesChanged, pickVoice, speak, voiceStatus } from '../lib/tts';
import { prefs, setPrefs } from '../lib/prefs';
import { downloadJson, exportProgress, importProgress } from '../lib/progress';
import { azureStatus } from '../lib/pronunciation';
import { getClockOffsetDays, now, setClockOffsetDays } from '../lib/clock';
import { toast } from '../ui/toast';
import { dayKey } from '../lib/clock';

function section(title: string, ...children: (Node | false | null | undefined)[]): HTMLElement {
  return h('section', { class: 'settings-section' }, h('h2', null, title), h('div', { class: 'card settings-card' }, children));
}

function field(label: string, control: Node, hint?: string): HTMLElement {
  return h('div', { class: 'field' }, h('div', { class: 'field__label' }, h('span', null, label), hint && h('small', null, hint)), control);
}

export const settingsView: View = async () => {
  const user = currentUser();
  const c = content();
  const seedVersion = await getMeta<number>('seed_version');

  // --- Voz -----------------------------------------------------------------
  const voiceSelect = h('select', {
    class: 'select',
    'aria-label': 'Voz francesa',
    'data-testid': 'voice-select',
    onchange: () => setPrefs({ voiceURI: voiceSelect.value || null }),
  });
  const voiceInfo = h('div', { class: 'voice-info', 'data-testid': 'voice-info' });
  const REGION: Record<string, string> = { fr: 'França', ca: 'Canadá', be: 'Bélgica', ch: 'Suíça', lu: 'Luxemburgo' };
  const regionOf = (lang: string) => REGION[lang.toLowerCase().replace('_', '-').split('-')[1] ?? 'fr'] ?? lang;
  const INSTALL = h(
    'ul',
    { class: 'voice-help' },
    h('li', null, h('strong', null, 'Android: '), 'Configurações → Acessibilidade → Texto para fala → Google → Instalar dados de voz → Français.'),
    h('li', null, h('strong', null, 'iPhone: '), 'Ajustes → Acessibilidade → Conteúdo Falado → Vozes → Français (baixe uma "Aprimorada").'),
    h('li', null, h('strong', null, 'Computador: '), 'use Chrome ou Edge (já trazem vozes francesas online).'),
  );
  const fillVoices = () => {
    const status = voiceStatus();
    const voices = frenchVoices();
    const active = pickVoice();
    voiceSelect.disabled = status !== 'ok';
    render(
      voiceSelect,
      status === 'ok'
        ? [
            h('option', { value: '' }, `Automática${active ? ` (${active.name})` : ''}`),
            voices.map((v) => h('option', { value: v.voiceURI, selected: prefs().voiceURI === v.voiceURI }, `${v.name} · ${regionOf(v.lang)}${v.localService ? '' : ' · online'}`)),
          ]
        : h('option', { value: '' }, status === 'loading' ? 'Procurando vozes…' : 'Nenhuma voz francesa disponível'),
    );
    const note = (text: string, extra?: Node) => h('div', { class: 'voice-note', dataset: { status } }, h('p', null, text), extra);
    render(
      voiceInfo,
      status === 'ok'
        ? h('p', { class: 'muted', dataset: { status } }, voices.length === 1 ? '1 voz francesa neste aparelho. Com duas ou mais, o treino de ouvido alterna entre elas.' : `${voices.length} vozes francesas neste aparelho. O treino de ouvido alterna entre elas.`)
        : status === 'loading'
          ? h('p', { class: 'muted', dataset: { status } }, 'Procurando as vozes do aparelho…')
          : status === 'no-french'
            ? note('Este aparelho tem vozes, mas nenhuma em francês. Para não ler francês com sotaque de outra língua, o áudio fica desligado até você instalar uma:', INSTALL)
            : status === 'none-listed'
              ? note('Este navegador não mostra a lista de vozes. O app pede francês ao sistema mesmo assim. Toque em "Testar voz" para conferir. Se não ouvir nada ou ouvir outro idioma, instale uma voz francesa:', INSTALL)
              : note('Este navegador não tem síntese de voz. Use Chrome, Edge ou Safari atualizados.'),
    );
  };
  ensureVoices();
  fillVoices();
  const unsubscribeVoices = onVoicesChanged(fillVoices);

  const rateValue = h('output', { class: 'range-value' }, `${prefs().speechRate.toFixed(2).replace(".", ",")}×`);
  const rateInput = h('input', {
    type: 'range', min: '0.5', max: '1.2', step: '0.05', value: String(prefs().speechRate), 'aria-label': 'Velocidade da fala',
    oninput: () => {
      setPrefs({ speechRate: Number(rateInput.value) });
      rateValue.textContent = `${Number(rateInput.value).toFixed(2).replace(".", ",")}×`;
    },
  });

  // --- Revisão -------------------------------------------------------------
  const newPerDay = h(
    'select',
    { class: 'select select--sm', 'aria-label': 'Palavras novas por dia', onchange: () => { setPrefs({ newPerDay: Number(newPerDay.value) }); notifyProgressChanged(); } },
    [5, 10, 15, 20, 30, 50].map((n) => h('option', { value: String(n), selected: prefs().newPerDay === n }, String(n))),
  );
  const soundsToggle = h('input', { type: 'checkbox', class: 'switch', checked: prefs().sounds, 'aria-label': 'Sons de acerto', onchange: () => setPrefs({ sounds: soundsToggle.checked }) });
  const autoplay = h('input', { type: 'checkbox', class: 'switch', checked: prefs().autoplay, 'aria-label': 'Tocar áudio automaticamente', onchange: () => setPrefs({ autoplay: autoplay.checked }) });

  // --- Sincronização entre aparelhos (código de casal) ----------------------
  const syncBox = h('div', { class: 'stack stack--sm', 'data-testid': 'sync-box' });
  const when = (iso: string) => {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return `${today ? 'hoje' : d.toLocaleDateString('pt-BR')}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const runSync = async (status: HTMLElement) => {
    status.textContent = 'Sincronizando…';
    try {
      const r = await syncNow();
      status.textContent = `Última sincronização: ${when(r.at)}. ${r.updated === 1 ? '1 palavra atualizada' : `${r.updated} palavras atualizadas`} neste aparelho.`;
      if (r.updated) notifyProgressChanged();
    } catch (e) {
      status.textContent = describeSyncError(e instanceof SyncError ? e.code : 'upstream');
    }
  };
  const renderSync = async () => {
    const code = await getSyncCode();
    if (!code) {
      const input = h('input', { class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, placeholder: 'código de vocês', 'aria-label': 'Código de sincronização', 'data-testid': 'sync-code-input' });
      const status = h('p', { class: 'muted', 'aria-live': 'polite', 'data-testid': 'sync-status' });
      render(
        syncBox,
        h('p', { class: 'muted' }, 'Os aparelhos com o mesmo código ficam com o mesmo progresso. Digitem o mesmo código nos dois celulares.'),
        input,
        h(
          'div',
          { class: 'row row--wrap' },
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => { input.value = generateSyncCode(); input.focus(); } }, 'Gerar um código'),
          h(
            'button',
            {
              class: 'btn btn--ghost btn--sm', type: 'button', 'data-testid': 'sync-save',
              onclick: async () => {
                if (input.value.trim().length < 8) {
                  status.textContent = describeSyncError('bad_code');
                  return;
                }
                await setSyncCode(input.value);
                await renderSync();
                const st = syncBox.querySelector<HTMLElement>('[data-testid=sync-status]');
                if (st) await runSync(st);
              },
            },
            'Salvar e sincronizar',
          ),
        ),
        status,
      );
      return;
    }
    const last = await getLastSync();
    const status = h('p', { class: 'muted', 'aria-live': 'polite', 'data-testid': 'sync-status' }, last ? `Última sincronização: ${when(last.at)}.` : 'Ainda não sincronizou.');
    render(
      syncBox,
      h('p', { class: 'muted' }, 'Sincroniza sozinho ao abrir o app. Código: ', h('strong', { 'data-testid': 'sync-code' }, code), '.'),
      status,
      h(
        'div',
        { class: 'row row--wrap' },
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', 'data-testid': 'sync-now', onclick: () => void runSync(status) }, 'Sincronizar agora'),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', 'data-testid': 'sync-off', onclick: async () => { await setSyncCode(null); await renderSync(); } }, 'Trocar código'),
      ),
    );
  };
  void renderSync();

  // --- Progresso -----------------------------------------------------------
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true, 'data-testid': 'import-file',
    onchange: async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      try {
        const summary = await importProgress(JSON.parse(await file.text()));
        toast(`Importado: ${summary.statesAdded} novas, ${summary.statesUpdated} atualizadas, ${summary.activityAdded} atividades.`, 'success', undefined, 5000);
        notifyProgressChanged();
      } catch (e) {
        toast((e as Error).message.includes('JSON') ? 'Arquivo não é um JSON válido.' : (e as Error).message, 'error', undefined, 5000);
      }
    },
  });

  // --- Azure ---------------------------------------------------------------
  const azureBox = h('span', { class: 'status status--checking' }, 'verificando…');
  void azureStatus().then((s) => {
    azureBox.className = `status status--${s}`;
    azureBox.textContent = s === 'configured' ? 'configurado' : s === 'not_configured' ? 'sem chave' : s === 'invalid_key' ? 'chave recusada' : s === 'offline' ? 'sem internet' : 'indisponível';
    if (s === 'offline' || s === 'invalid_key') azureBox.className = 'status status--unreachable';
    azureBox.dataset.testid = 'azure-settings-status';
  });

  // --- Data simulada (testes) ----------------------------------------------
  const clockInfo = h('p', { class: 'muted' });
  const updateClock = () => {
    const off = getClockOffsetDays();
    clockInfo.textContent = off
      ? `Data simulada: ${now().toLocaleString('pt-BR')} (+${off} dia${off > 1 ? 's' : ''}).`
      : `Usando a data real: ${now().toLocaleDateString('pt-BR')}.`;
  };
  updateClock();
  const shiftClock = (days: number) => {
    setClockOffsetDays(days === 0 ? 0 : getClockOffsetDays() + days);
    notifyProgressChanged();
    navigate('/ajustes');
  };

  return {
    title: 'Ajustes',
    tab: 'settings',
    cleanup: unsubscribeVoices,
    content: h(
      'div',
      { class: 'stack' },
      section(
        'Perfil',
        h(
          'div',
          { class: 'field' },
          h('div', { class: 'field__label' }, h('span', null, user.name), h('small', null, 'Perfil ativo neste aparelho')),
          h('a', { class: 'btn btn--ghost btn--sm', href: '#/perfil' }, 'Trocar'),
        ),
      ),
      section(
        'Voz em francês',
        field('Voz', selectWrap(voiceSelect)),
        voiceInfo,
        field('Velocidade', h('div', { class: 'range' }, rateInput, rateValue)),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => void speak("Bonjour ! On va apprendre le français ensemble.") }, 'Testar voz'),
      ),
      section(
        'Estudo',
        field('Palavras novas por dia', selectWrap(newPerDay, false)),
        field('Tocar o áudio sozinho', autoplay),
        field('Sons de acerto', soundsToggle),
      ),
      section('Sincronizar entre aparelhos', syncBox),
      section(
        'Cópia em arquivo',
        h('p', { class: 'muted' }, 'Uma cópia do progresso para guardar ou levar a outro aparelho sem internet.'),
        h(
          'div',
          { class: 'row row--wrap' },
          h(
            'button',
            {
              class: 'btn btn--primary btn--sm', type: 'button', 'data-testid': 'export',
              onclick: async () => downloadJson(await exportProgress(), `poliglotas-progresso-${dayKey(new Date())}.json`),
            },
            'Exportar progresso',
          ),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => fileInput.click() }, 'Importar'),
          fileInput,
        ),
      ),
      section(
        'Nota de pronúncia',
        field('Serviço de nota', azureBox),
      ),
      section(
        'Para testar',
        h('p', { class: 'muted' }, 'Avance a data para testar a revisão sem esperar.'),
        clockInfo,
        h(
          'div',
          { class: 'row row--wrap' },
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => shiftClock(1), 'data-testid': 'clock-plus-1' }, '+1 dia'),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => shiftClock(7) }, '+7 dias'),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => shiftClock(0), disabled: getClockOffsetDays() === 0 }, 'Voltar à data real'),
        ),
      ),
      section(
        'Sobre',
        h(
          'p',
          { class: 'muted' },
          `${c.words.length} palavras e ${c.frames.length} frases. Conteúdo v${seedVersion ?? '?'}.`,
        ),
        h(
          'button',
          {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: async () => { await loadContent(true); toast('Conteúdo recarregado.', 'success'); },
          },
          'Recarregar conteúdo',
        ),
      ),
    ),
  };
};
