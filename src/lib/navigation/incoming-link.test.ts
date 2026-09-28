import { incomingLink } from './incoming-link';
import { sharePath } from './params';
const id = '123e4567-e89b-42d3-a456-426614174000';
describe('external links', () => {
  it.each([
    ['/verify-email', '/verify-email'], ['/e-posta-dogrula', '/verify-email'],
    ['/reset-password', '/reset-password'], ['/parola-yenile', '/reset-password'],
  ])('accepts the actual mail token fragment on %s', (path, target) => {
    const token = 'a'.repeat(43);
    expect(incomingLink(`https://tanidikvar.com.tr${path}#token=${token}`)).toBe(`${target}?token=${token}`);
    expect(incomingLink(`${path}#token=${token}`)).toBe(`${target}?token=${token}`);
  });
  it('rejects ambiguous, malformed and foreign mail fragments', () => {
    const token = 'a'.repeat(43);
    for (const input of [
      `https://evil.test/verify-email#token=${token}`,
      `/profil#token=${token}`, `/verify-email?token=${token}#token=${token}`,
      `/verify-email#token=${token}&token=${token}`, `/verify-email#token=${token}&returnTo=/profil`,
      `/verify-email#token=${token}#extra`, '/verify-email#token=short', '/verify-email#',
    ]) expect(incomingLink(input)).toBeNull();
  });
  it('preserves the selected year in a shared annual report and opens Tanıdık profiles', () => {
    expect(incomingLink(`https://tanidikvar.com.tr/tanidik/${id}/karne?year=2024`)).toBe(`/annual-report/${id}?year=2024`);
    expect(incomingLink(`https://tanidikvar.com.tr/tanidik/${id}/karne`)).toBe(`/annual-report/${id}`);
    expect(incomingLink(`https://tanidikvar.com.tr/tanidik/${id}`)).toBe(`/profiles/${id}`);
  });
  it.each(['year=2019', 'year=9999', 'year=bad', 'year=2024&year=2025', 'year=2024&id=other', 'unexpected=1'])('rejects invalid report parameters: %s', search => {
    expect(incomingLink(`https://tanidikvar.com.tr/tanidik/${id}/karne?${search}`)).toBeNull();
  });
  it.each(['exp://192.168.1.10:8081', 'exp://192.168.1.10:8081/', 'exp://192.168.1.10:8081/--/', 'exps://project.exp.direct'])('opens Expo Go QR at the root: %s', url => {
    expect(incomingLink(url, undefined, true)).toBe('/');
    expect(incomingLink(url)).toBeNull();
  });
  it('validates Expo Go routes using the same destination rules', () => {
    expect(incomingLink(`exp://192.168.1.10:8081/--/questions/${id}`, undefined, true)).toBe(`/questions/${id}`);
    expect(incomingLink('exp://192.168.1.10:8081/--/collection?kind=saved', undefined, true)).toBe('/collection?kind=saved');
  });
  it.each(['exp://host/--/questions/nope', 'exp://host/--//evil.test', 'exp://user:password@host/--/profil', 'exp://host/--/profil#fragment', 'exp://host/--/%2e%2e/profil', 'exp://host/profil', 'exp://host/--/profil?unexpected=x', 'https://evil.test/profil'])('rejects unsafe routes even in Expo Go: %s', url => {
    expect(incomingLink(url, undefined, true)).toBeNull();
  });
  it.each(['sorular', 'universiteler', 'programlar', 'profil'] as const)('opens shared %s URLs', kind => {
    const expected = { sorular: 'questions', universiteler: 'universities', programlar: 'programs', profil: 'profiles' }[kind];
    expect(incomingLink(sharePath(kind, id, 'İstanbul deneyimi'))).toBe(`/${expected}/${id}`);
  });
  it('keeps native targets and validated search for the login return', () => {
    expect(incomingLink(`tanidikvar-dev://questions/${id}`)).toBe(`/questions/${id}`);
    expect(incomingLink('tanidikvar-preview://collection?kind=saved')).toBe('/collection?kind=saved');
    expect(incomingLink('tanidikvar:///bildirimler')).toBe('/bildirimler');
    expect(incomingLink('tanidikvar-dev://')).toBe('/');
  });
  it.each(['https://evil.test/profil', '//evil.test/profil', 'javascript:alert(1)', '/questions/nope', '/profil?unexpected=x', '/%2e%2e/profil', '/profil#fragment', '/questions/new?universityId=bad', 'https://user:password@tanidikvar.com.tr/profil', '/profil?x=1?x=2', 'tanidikvar://profile/../profil', '/profil\\evil'])('rejects untrusted input %s', input => {
    expect(incomingLink(input)).toBeNull();
  });
  it('validates one-time action tokens and rejects duplicate parameters', () => {
    const token = 'a'.repeat(43);
    expect(incomingLink(`tanidikvar://reset-password?token=${token}`)).toBe(`/reset-password?token=${token}`);
    expect(incomingLink(`/reset-password?token=${token}&token=${token}`)).toBeNull();
    expect(incomingLink('/verify-email?token=bad')).toBeNull();
  });
});

describe('city and owner-edit web destinations', () => {
  it('preserves a Turkish city name in a validated native destination', () => {
    expect(incomingLink('https://tanidikvar.com.tr/sehir/%C4%B0stanbul')).toBe('/city/%C4%B0stanbul');
  });
  it('maps an owner-edit link without bypassing the authenticated route', () => {
    const id='123e4567-e89b-42d3-a456-426614174000';
    expect(incomingLink(`https://tanidikvar.com.tr/soru/soru-basligi-${id}/duzenle`)).toBe(`/questions/${id}/edit`);
    expect(incomingLink(`https://tanidikvar.com.tr/program/${id}/duzenle`)).toBeNull();
  });
  it.each(['/sehir/Ankara/extra','/sehir/%2FAnkara','/sehir/%00Ankara','/sehir/%ZZ','/sehir/Ankara?admin=true'])('rejects invalid city input %s', path => {
    expect(incomingLink(path)).toBeNull();
  });
});
