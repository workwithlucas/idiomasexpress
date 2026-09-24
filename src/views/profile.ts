import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { getReviewStats, listUsers } from '../db/repo';
import { maybeUser, setCurrentUser } from '../ui/session';

export const profileView: View = async () => {
  const users = await listUsers();
  const stats = await Promise.all(users.map((u) => getReviewStats(u.id)));
  const active = maybeUser();

  return {
    title: 'Quem vai estudar?',
    bare: true,
    content: h(
      'div',
      { class: 'profile' },
      h(
        'div',
        { class: 'profile__hero' },
        h('div', { class: 'profile__mark', 'aria-hidden': 'true' }, 'é'),
        h('p', { class: 'eyebrow' }, 'Idiomas Express'),
        h('h1', { class: 'profile__title' }, 'Bonjour ! Quem vai estudar agora?'),
        h('p', { class: 'profile__lead' }, 'Cada perfil tem sua própria revisão e progresso, salvos neste aparelho.'),
      ),
      h(
        'ul',
        { class: 'profile__list' },
        users.map((u, i) =>
          h(
            'li',
            null,
            h(
              'button',
              {
                class: `profile-card${active?.id === u.id ? ' profile-card--active' : ''}`,
                type: 'button',
                dataset: { user: u.id },
                onclick: () => {
                  setCurrentUser(u);
                  navigate('/');
                },
              },
              h('span', { class: 'profile-card__avatar', dataset: { user: u.id } }, u.name.charAt(0)),
              h(
                'span',
                { class: 'profile-card__text' },
                h('strong', null, u.name),
                h('span', null, stats[i].inStudy ? `${stats[i].inStudy} palavras em estudo · ${stats[i].dueNow} para revisar` : 'Começando agora'),
              ),
              icon('chevronRight', 20),
            ),
          ),
        ),
      ),
    ),
  };
};
