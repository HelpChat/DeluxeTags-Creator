import { DEFAULT_CONFIG } from './constants';
import { toLines } from './util';
import type { Config } from './types';

export function replacePlaceholders(
  text: unknown,
  context: Record<string, any> = {},
  config: Config = DEFAULT_CONFIG,
): string {
  // Raw mode: leave placeholders untouched.
  if (context.parse === false) return String(text ?? '');
  const tag = context.tag ||
    context.currentTag || {
      identifier: '',
      tag: '',
      description: [],
    };
  const page = Math.max(1, Number.parseInt(context.page, 10) || 1);
  const hasNextPage = Boolean(context.hasNextPage);
  const description = toLines(tag.description).join('\n');
  const category = context.categoryIdentifier || tag.category || 'all';
  const amount = context.amount != null ? String(context.amount) : '0';
  const categoryAmount = context.categoryAmount != null ? String(context.categoryAmount) : amount;
  const canSelect = context.canSelect !== false;
  const availability = canSelect
    ? config.gui?.tag_availability_placeholder?.has_permission || ''
    : config.gui?.tag_availability_placeholder?.no_permission || '';

  return String(text ?? '')
    .replaceAll('%player%', context.playerName || 'Steve')
    .replaceAll('{player}', context.playerName || 'Steve')
    .replaceAll('%displayname%', context.displayName || context.playerName || 'Steve')
    .replaceAll('{displayname}', context.displayName || context.playerName || 'Steve')
    .replaceAll('%deluxetags_tag%', tag.tag || '')
    .replaceAll('{deluxetags_tag}', tag.tag || '')
    .replaceAll('%deluxetags_identifier%', tag.identifier || '')
    .replaceAll('{deluxetags_identifier}', tag.identifier || '')
    .replaceAll('%deluxetags_description%', description)
    .replaceAll('{deluxetags_description}', description)
    .replaceAll('%deluxetags_amount%', amount)
    .replaceAll('{deluxetags_amount}', amount)
    .replaceAll('%deluxetags_category_amount%', categoryAmount)
    .replaceAll('{deluxetags_category_amount}', categoryAmount)
    .replaceAll('%deluxetags_available%', availability)
    .replaceAll('{deluxetags_available}', availability)
    .replaceAll('%previous_page%', page === 1 ? '' : String(page - 1))
    .replaceAll('{previous_page}', page === 1 ? '' : String(page - 1))
    .replaceAll('%current_page%', String(page))
    .replaceAll('{current_page}', String(page))
    .replaceAll('%next_page%', hasNextPage ? String(page + 1) : '')
    .replaceAll('{next_page}', hasNextPage ? String(page + 1) : '')
    .replaceAll('%category%', category)
    .replaceAll('{category}', category);
}
