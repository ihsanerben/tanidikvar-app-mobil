const groups = [
  { title: 'Sorular', keys: ['FIRST_QUESTION', 'QUESTIONS_10'] },
  { title: 'Yorumlar', keys: ['FIRST_ANSWER', 'ANSWERS_10', 'ANSWERS_50'] },
  { title: 'Kampüs deneyimi', keys: ['FIRST_EVALUATION', 'FIRST_EXPERIENCE', 'EXPERIENCES_5'] },
  { title: 'Topluluk katılımı', keys: ['FIRST_POLL', 'VOTES_10'] },
  { title: 'Gerçek hayat verileri', keys: ['FIRST_METRIC', 'METRICS_10'] },
  { title: 'Tanıdık yılları', keys: ['TENURE_1', 'TENURE_3', 'TENURE_5'] },
  { title: 'Dönem rehberleri', keys: ['PREFERENCE_GUIDE', 'NEW_STUDENT_GUIDE', 'FINAL_GUIDE', 'ERASMUS_GUIDE', 'INTERNSHIP_GUIDE'] },
] as const;

export function groupAchievementEntries<T extends { definition: { key?: string | null } }>(entries: T[]) {
  const known = new Set<string>(groups.flatMap(group => group.keys));
  const result: { title: string; items: T[] }[] = groups.map(group => ({ title: group.title, items: group.keys.flatMap(key => entries.filter(entry => entry.definition.key === key)) }));
  const other = entries.filter(entry => !entry.definition.key || !known.has(entry.definition.key));
  if (other.length) result.push({ title: 'Diğer rozetler', items: other });
  return result.filter(group => group.items.length);
}
