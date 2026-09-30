import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from '@/components/ui/text';
import type { Schema } from '@/lib/api/types';
import { ProgramCard, UniversityProgramCard } from './cards';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const program: Schema['ProgramSummaryResponse'] = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  name: 'Bilgisayar Mühendisliği',
  degreeLevel: 'LISANS',
  scoreTypes: ['SAY'],
  universityName: 'Örnek Üniversitesi',
  city: 'Ankara',
  faculties: ['Mühendislik Fakültesi'],
  currentBestRank: 12345,
  currentMinimumScore: 456.789,
  currentQuota: 80,
};

it.each([
  ['Programlar', false],
  ['üniversite programları', true],
])('%s kartında webdeki tüm program alanlarını kırpmadan gösterir', async (_, university) => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(university ? <UniversityProgramCard item={program} /> : <ProgramCard item={program} tile />);
  });
  try {
    const texts = tree.root.findAllByType(Text);
    const content = texts.map(node => String(node.props.children)).join(' ');
    for (const value of ['Bilgisayar Mühendisliği', 'Örnek Üniversitesi', 'Mühendislik Fakültesi', '2026 başarı sırası', '12.345', 'Taban puan', '456,789', 'Kontenjan', '80', 'Programı incele']) {
      expect(content).toContain(value);
    }
    expect(texts.every(node => node.props.numberOfLines == null)).toBe(true);
  } finally {
    await act(async () => tree.unmount());
  }
});
