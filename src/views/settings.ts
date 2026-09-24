import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
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
        ? h('p', { class: 'muted', dataset: { status } }, voices.length === 1 ? '1 voz francesa neste aparelho. Com duas ou mais, o treino de ouvido alterna entre elas.' : `${voices.length} vozes francesas neste aparelho — o treino de ouvido alterna entre elas.`)
        : status === 'loading'
          ? h('p', { class: 'muted', dataset: { status } }, 'Procurando as vozes do aparelho…')
          : status === 'no-french'
            ? note('Este aparelho tem vozes, mas nenhuma em francês. Para não ler francês com sotaque de outra língua, o áudio fica desligado até você instalar uma:', INSTALL)
            : status === 'none-listed'
              ? note('Este navegador não mostra a lista de vozes. O app pede francês ao sistema mesmo assim — toque em "Testar voz" para conferir. Se não ouvir nada ou ouvir outro idioma, instale uma voz francesa:', INSTALL)
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
    azureBox.textContent = s === 'configured' ? 'configurado' : s === 'not_configured' ? 'sem chave' : s === 'offline' ? 'sem internet' : 'indisponível';
    if (s === 'offline') azureBox.className = 'status status--unreachable';
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
          h('a', { class: 'btn btn--ghost btn--sm', href: '#/perfil' }, icon('user', 16), 'Trocar'),
        ),
      ),
      section(
        'Voz em francês',
        field('Voz', voiceSelect),
        voiceInfo,
        field('Velocidade', h('div', { class: 'range' }, rateInput, rateValue)),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => void speak("Bonjour ! On va apprendre le français ensemble.") }, icon('play', 16), 'Testar voz'),
      ),
      section(
        'Estudo',
        field('Palavras novas por dia', newPerDay),
        field('Tocar o áudio sozinho', autoplay),
        field('Sons de acerto', soundsToggle),
      ),
      section(
        'Progresso e sincronização',
        h('p', { class: 'muted' }, 'Fica tudo neste aparelho. Para levar a outro celular: exporte aqui, importe lá.'),
        h(
          'div',
          { class: 'row row--wrap' },
          h(
            'button',
            {
              class: 'btn btn--primary btn--sm', type: 'button', 'data-testid': 'export',
              onclick: async () => downloadJson(await exportProgress(), `cedilha-progresso-${dayKey(new Date())}.json`),
            },
            icon('download', 16), 'Exportar progresso',
          ),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => fileInput.click() }, icon('upload', 16), 'Importar'),
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
          `${c.words.length} palavras, ${c.cognateRules.length} padrões de palavras-irmãs, ${c.readingRules.length} jeitos de ler, ${c.minimalPairs.length} pares de sons, ${c.frames.length} frases e ${c.scenes.length} situações. Versão do conteúdo: ${seedVersion ?? '?'}.`,
        ),
        h(
          'button',
          {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: async () => { await loadContent(true); toast('Conteúdo recarregado.', 'success'); },
          },
          icon('refresh', 16), 'Recarregar conteúdo',
        ),
      ),
    ),
  };
};
