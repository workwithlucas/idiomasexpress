import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { currentUser } from '../ui/session';
import {
  computeStreak, content, countIntroducedToday, getActivity, getNewWords, getReviewStats, modulesPracticedToday,
} from '../db/repo';
import { dayKey, now } from '../lib/clock';
import { prefs } from '../lib/prefs';
import { formatInterval } from '../lib/fsrs';
import { ipa, playButton } from '../ui/components';
import { withArticle } from '../lib/text';
import { MODULES } from './modules';

function greeting(d: Date): string {
  const hr = d.getHours();
  if (hr < 12) return 'Bonjour';
  if (hr < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Palavra do dia: determinística por data, entre as 300 mais frequentes. */
function wordOfTheDay() {
  const core = content().words.filter((w) => w.freq_rank <= 300 && (w.memory_hook_pt || w.cognate_rule_id));
  const key = dayKey(now());
  let hash = 0;
  for (const c of key) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return core[hash % core.length];
}

export const homeView: View = async () => {
  const user = currentUser();
  const [stats, activity, introduced] = await Promise.all([
    getReviewStats(user.id),
    getActivity(user.id),
    countIntroducedToday(user.id),
  ]);
  const newAvailable = (await getNewWords(user.id, Math.max(0, prefs().newPerDay - introduced))).length;
  const streak = computeStreak(activity);
  const doneToday = modulesPracticedToday(activity);
  const wotd = wordOfTheDay();
  const t = now();
  const total = stats.dueNow + newAvailable;

  const reviewCard = h(
    'section',
    { class: 'hero-card' },
    h('p', { class: 'eyebrow eyebrow--light' }, 'Revisão de hoje'),
    total > 0
      ? [
          h('div', { class: 'hero-card__count' }, h('span', { class: 'hero-card__num', 'data-testid': 'due-count' }, String(stats.dueNow)), h('span', null, stats.dueNow === 1 ? 'revisão' : 'revisões')),
          h('p', { class: 'hero-card__sub' }, `+ ${newAvailable} palavra${newAvailable === 1 ? '' : 's'} nova${newAvailable === 1 ? '' : 's'} disponíve${newAvailable === 1 ? 'l' : 'is'}`),
          h('a', { class: 'btn btn--light btn--block', href: '#/revisao' }, 'Começar revisão', icon('arrowRight', 18)),
        ]
      : [
          h('div', { class: 'hero-card__count' }, h('span', { class: 'hero-card__num', 'data-testid': 'due-count' }, '0'), h('span', null, 'revisões')),
          h(
            'p',
            { class: 'hero-card__sub' },
            stats.nextDue ? `Tudo em dia! Próxima revisão em ${formatInterval(t, stats.nextDue)}.` : 'Tudo em dia! Aumente o limite de palavras novas em Ajustes se quiser mais.',
          ),
        ],
  );

  return {
    title: 'Hoje',
    tab: 'home',
    content: h(
      'div',
      { class: 'stack' },
      h('div', { class: 'greeting' }, h('p', { class: 'eyebrow' }, t.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })), h('h2', null, `${greeting(t)}, ${user.name} !`)),
      reviewCard,
      h(
        'div',
        { class: 'stats' },
        stat('flame', String(streak), streak === 1 ? 'dia seguido' : 'dias seguidos'),
        stat('learn', String(stats.inStudy), 'em estudo'),
        stat('sparkles', String(stats.mature), 'consolidadas'),
      ),
      wotd &&
        h(
          'section',
          { class: 'card wotd' },
          h('p', { class: 'eyebrow' }, 'Palavra do dia'),
          h(
            'div',
            { class: 'wotd__row' },
            h('div', null, h('div', { class: 'wotd__fr', lang: 'fr' }, withArticle(wotd)), h('div', { class: 'wotd__meta' }, ipa(wotd.ipa), ' · ', wotd.pt)),
            playButton(wotd.fr, { wordId: wotd.id, size: 'lg' }),
          ),
          wotd.memory_hook_pt && h('p', { class: 'wotd__hook' }, wotd.memory_hook_pt),
          wotd.cognate_rule_id && h('p', { class: 'wotd__hook' }, `Cognato: ${content().ruleById.get(wotd.cognate_rule_id)?.pattern}`),
        ),
      h('h3', { class: 'list-heading' }, 'Módulos'),
      h(
        'ul',
        { class: 'module-list' },
        MODULES.map((m) =>
          h(
            'li',
            null,
            h(
              'a',
              { class: `module-tile module-tile--${m.accent}`, href: `#${m.route}`, dataset: { module: m.id } },
              h('span', { class: 'module-tile__icon' }, icon(m.icon, 22)),
              h('span', { class: 'module-tile__text' }, h('strong', null, m.title), h('span', null, m.subtitle)),
              doneToday.has(m.id) ? h('span', { class: 'module-tile__done', title: 'Praticado hoje' }, icon('check', 16)) : icon('chevronRight', 18),
            ),
          ),
        ),
      ),
    ),
  };
};

function stat(iconName: string, value: string, label: string) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat__icon' }, icon(iconName, 18)), h('strong', null, value), h('span', null, label));
}
