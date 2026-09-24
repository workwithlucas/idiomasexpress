import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { content, loadContent } from '../db/repo';
import { getMeta } from '../db/database';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { allVoicesCount, frenchVoices, onVoicesChanged, pickVoice, speak, ttsSupported } from '../lib/tts';
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
    onchange: () => setPrefs({ voiceURI: voiceSelect.value || null }),
  });
  const voiceWarning = h('p', { class: 'form-error', hidden: true, 'data-testid': 'no-french-voice' },
    'Nenhuma voz francesa neste aparelho: o áudio fica desativado para não tocar em outro idioma. ',
    'Android: Configurações → Texto para fala → Google → instalar dados de voz "Français". ',
    'iPhone: Ajustes → Acessibilidade → Conteúdo Falado → Vozes → Français.');
  const fillVoices = () => {
    const voices = frenchVoices();
    voiceWarning.hidden = !(voices.length === 0 && allVoicesCount() > 0);
    const active = pickVoice();
    render(
      voiceSelect,
      h('option', { value: '' }, voices.length ? `Automática${active ? ` (${active.name})` : ''}` : 'Nenhuma voz francesa encontrada'),
      voices.map((v) => h('option', { value: v.voiceURI, selected: prefs().voiceURI === v.voiceURI }, `${v.name} · ${v.lang}${v.localService ? '' : ' · online'}`)),
    );
  };
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
        !ttsSupported && h('p', { class: 'form-error' }, 'Este navegador não tem síntese de voz.'),
        field('Voz', voiceSelect, 'Vozes marcadas "online" precisam de internet.'),
        voiceWarning,
        field('Velocidade', h('div', { class: 'range' }, rateInput, rateValue)),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => void speak("Bonjour ! On va apprendre le français ensemble.") }, icon('play', 16), 'Testar voz'),
      ),
      section(
        'Revisão espaçada',
        field('Palavras novas por dia', newPerDay, 'Por perfil, em ordem de frequência.'),
        field('Tocar áudio ao mostrar a palavra', autoplay),
      ),
      section(
        'Progresso e sincronização',
        h('p', { class: 'muted' }, 'Tudo fica salvo só neste aparelho. Para levar o progresso a outro celular, exporte aqui e importe lá (os dois perfis vão juntos; em conflito, vale a revisão mais recente).'),
        h(
          'div',
          { class: 'row row--wrap' },
          h(
            'button',
            {
              class: 'btn btn--primary btn--sm', type: 'button', 'data-testid': 'export',
              onclick: async () => downloadJson(await exportProgress(), `idiomasexpress-progresso-${dayKey(new Date())}.json`),
            },
            icon('download', 16), 'Exportar progresso',
          ),
          h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => fileInput.click() }, icon('upload', 16), 'Importar'),
          fileInput,
        ),
      ),
      section(
        'Avaliação de pronúncia',
        field('Azure Speech', azureBox, 'Chave e região ficam no servidor (.env / Netlify).'),
      ),
      section(
        'Ferramentas de teste',
        h('p', { class: 'muted' }, 'Avance a data do app para conferir o agendamento da revisão espaçada sem esperar.'),
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
          `Conteúdo v${seedVersion ?? '?'}: ${c.words.length} palavras (300 mais frequentes + vocabulário de situações), ${c.cognateRules.length} regras de cognatos, ${c.readingRules.length} regras de leitura, ${c.minimalPairs.length} pares mínimos, ${c.frames.length} moldes e ${c.scenes.length} situações. Revisão agendada com FSRS (ts-fsrs).`,
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
