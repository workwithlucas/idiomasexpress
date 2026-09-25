import { h } from '../ui/dom';
import { brandMark, icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { getMomentoProgress, listUsers } from '../db/repo';
import { maybeUser, setCurrentUser } from '../ui/user';

export const profileView: View = async () => {
  const users = await listUsers();
  const stats = await Promise.all(users.map(async (u) => (await getMomentoProgress(u.id)).length));
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
        h('div', { class: 'profile__brand' }, h('span', { class: 'profile__mark', 'aria-hidden': 'true' }, brandMark(60)), h('span', { class: 'profile__name' }, 'Poliglotas')),
        h('p', { class: 'profile__tagline' }, 'O francês que já é seu vizinho.'),
        h('h1', { class: 'profile__title' }, 'Bonjour ! Quem é você?'),
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
                h('span', null, stats[i] ? `${stats[i]} ${stats[i] === 1 ? 'momento feito' : 'momentos feitos'}` : 'Começando agora'),
              ),
              icon('chevronRight', 20),
            ),
          ),
        ),
      ),
    ),
  };
};
