import { incomingLink } from './incoming-link';
import { sharePath } from './params';
const id = '123e4567-e89b-42d3-a456-426614174000';
describe('external links', () => {
  it.each(['sorular', 'universiteler', 'programlar', 'profil'] as const)('opens shared %s URLs', kind => {
    const expected = { sorular: 'questions', universiteler: 'universities', programlar: 'programs', profil: 'profiles' }[kind];
    expect(incomingLink(sharePath(kind, id, 'İstanbul deneyimi'))).toBe(`/${expected}/${id}`);
  });
  it('keeps native targets and validated search for the login return', () => {
    expect(incomingLink(`tanidikvar-dev://questions/${id}`)).toBe(`/questions/${id}`);
    expect(incomingLink('tanidikvar-preview://collection?kind=saved')).toBe('/collection?kind=saved');
    expect(incomingLink('tanidikvar:///bildirimler')).toBe('/bildirimler');
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
