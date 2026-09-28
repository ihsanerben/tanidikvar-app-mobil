import { canCompare, comparisonOption, comparisonParams, comparisonWebUrl } from './comparison-model';
import { incomingLink } from '@/lib/navigation/incoming-link';
const a = '123e4567-e89b-42d3-a456-426614174000';
const b = '123e4567-e89b-42d3-a456-426614174001';
const c = '123e4567-e89b-42d3-a456-426614174002';
describe('comparison state and sharing', () => {
  it('requires the first two complete selections and a complete optional third program', () => {
    expect(canCompare(comparisonParams.parse({u1:a,u3:b}))).toBe(false);
    expect(canCompare(comparisonParams.parse({u1:a,u2:b}))).toBe(true);
    expect(canCompare(comparisonParams.parse({u1:a,u2:a}))).toBe(false);
    expect(canCompare(comparisonParams.parse({mode:'PROGRAM',u1:a,u2:b,p1:a,p2:b,u3:c}))).toBe(false);
    expect(canCompare(comparisonParams.parse({mode:'PROGRAM',u1:a,u2:a,p1:a,p2:b}))).toBe(true);
  });
  it('round trips the selected year and every column through the canonical web link', () => {
    const params = comparisonParams.parse({mode:'PROGRAM',year:'2024',u1:a,u2:b,u3:c,p1:a,p2:b,p3:c});
    const link = comparisonWebUrl(params);
    const destination = incomingLink(link)!;
    expect(destination.startsWith('/compare?')).toBe(true);
    expect(comparisonParams.parse(Object.fromEntries(new URLSearchParams(destination.split('?')[1])))).toEqual(params);
    expect(incomingLink(`${link}&u1=${b}`)).toBeNull();
    expect(incomingLink(`${link}&token=secret`)).toBeNull();
    expect(incomingLink('https://tanidikvar.com.tr/karsilastir?u1=bad')).toBeNull();
  });
  it('selects a same-year unranked option before an unrelated year', () => {
    const options = [{id:'old',statistics:[{year:2023,successRank:10}]},{id:'current',statistics:[{year:2024,successRank:undefined}]}];
    expect(comparisonOption({options},2024)?.id).toBe('current');
    expect(comparisonOption({options:[...options,{id:'ranked',statistics:[{year:2024,successRank:20}]}]},2024)?.id).toBe('ranked');
  });
});
