import { groupAchievementEntries } from './achievement-groups';

it('keeps related badges together and orders Tanıdık tenure from one to five years', () => {
  const entries = ['TENURE_5', 'FIRST_ANSWER', 'TENURE_1', 'TENURE_3', 'UNKNOWN'].map(key => ({ definition: { key } }));
  const groups = groupAchievementEntries(entries);
  expect(groups.find(group => group.title === 'Tanıdık yılları')?.items.map(item => item.definition.key))
    .toEqual(['TENURE_1', 'TENURE_3', 'TENURE_5']);
  expect(groups.find(group => group.title === 'Yorumlar')?.items.map(item => item.definition.key))
    .toEqual(['FIRST_ANSWER']);
  expect(groups.at(-1)?.title).toBe('Diğer rozetler');
});
