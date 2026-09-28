import { incomingLink } from './incoming-link';
describe('public web link parity', () => {
  it.each([
    ['/universiteler?city=Ankara', '/kesfet?kind=universities&city=Ankara'],
    ['/programlar?programName=Tıp&tur=DEVLET&yil=2025&sirala=SCORE&puanMin=400', '/kesfet?kind=programs&programName=T%C4%B1p&institutionType=DEVLET&year=2025&sort=SCORE&scoreFrom=400'],
    ['/populer?donem=WEEKLY', '/?period=WEEKLY'], ['/populer', '/?period=ALL_TIME'],
    ['/sorular?cevap=unanswered&dogrulanmis=yes&sirala=MOST_VIEWED', '/?answered=false&verifiedAnswer=true&sort=MOST_VIEWED'],
    ['/tanidiklar?educationStatus=MEZUN&universityId=', '/people?educationStatus=MEZUN'],
    ['/arama?q=kampus', '/search?q=kampus'], ['/siralama?period=YEARLY', '/leaderboard?period=YEARLY'],
    ['/istatistikler', '/statistics'], ['/durum', '/status'],
    ['/hakkimizda#iletisim', '/about?section=contact'], ['/soru-sor', '/questions/new'],
  ])('maps %s without losing its filters', (source, expected) => {
    expect(incomingLink(`https://tanidikvar.com.tr${source}`)).toBe(expected);
  });
  it.each([
    '/programlar?kind=universities', '/programlar?yil=2024&year=2025', '/programlar?siraMin=10&siraMax=5',
    '/arama?unknown=', '/istatistikler?token=', '/sorular?cevap=invalid', '/populer?donem=invalid',
    '/yonetim', '/yonetim/kullanicilar', '/hakkimizda#anything',
  ])('rejects conflicting or unsupported targets: %s', source => {
    expect(incomingLink(`https://tanidikvar.com.tr${source}`)).toBeNull();
  });
});
