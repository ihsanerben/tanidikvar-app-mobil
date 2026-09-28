import {
  catalogParams,
  idParams,
  questionParams,
  communityParams,
  sharePath,
} from "./params";
import {
  isSafeDestination,
  preserveDestination,
  destinationHref,
} from "./destination";
const id = "123e4567-e89b-42d3-a456-426614174000";
describe("mobile route boundaries", () => {
  it('accepts independent catalog filters and rejects inverted or malformed ranges', () => {
    expect(catalogParams.parse({ programName: 'Tıp', universityName: 'İstanbul', year: '2025', rankFrom: '1', rankTo: '5000', scoreFrom: '400,125', scoreTo: '550', sort: 'SCORE' }).programName).toBe('Tıp');
    expect(catalogParams.safeParse({ sort: 'QUOTA' }).success).toBe(true);
    for (const filters of [{rankFrom:'0'}, {rankFrom:'-1'}, {rankFrom:'1e3'}, {rankFrom:'100',rankTo:'50'}, {scoreFrom:'400',scoreTo:'300'}, {year:'9999'}, {scoreFrom:'NaN'}])
      expect(catalogParams.safeParse(filters).success).toBe(false);
    expect(isSafeDestination('/kesfet?kind=programs&programName=Tıp&year=2025&rankTo=5000&sort=SCORE')).toBe(true);
  });
  it('validates expanded question filters and rejects unknown fields on login destinations', () => {
    expect(questionParams.parse({ scope: 'UNIVERSITY', universityId: id, answered: 'false', verifiedAnswer: 'true', period: 'YEARLY', sort: 'MOST_COMMENTED' }).period).toBe('YEARLY');
    expect(questionParams.safeParse({ answered: 'yes' }).success).toBe(false);
    expect(isSafeDestination('/?period=YEARLY&answered=false')).toBe(true);
    expect(isSafeDestination('/search?q=kampus&kind=people')).toBe(true);
    expect(isSafeDestination('/my-questions?status=ARCHIVED')).toBe(true);
    expect(isSafeDestination('/my-comments?kind=anonymous&scope=UNIVERSITY')).toBe(true);
    expect(isSafeDestination('/my-comments?kind=community&anonymous=true&scope=UNIVERSITY')).toBe(true);
    expect(isSafeDestination('/my-comments?kind=community&anonymous=invalid')).toBe(false);
    expect(isSafeDestination('/compare')).toBe(true);
    expect(isSafeDestination('/statistics')).toBe(true);
    expect(isSafeDestination('/my-comments?kind=unknown')).toBe(false);
    expect(isSafeDestination('/search?kind=unknown')).toBe(false);
    expect(isSafeDestination('/people?universityId=invalid')).toBe(false);
    expect(isSafeDestination('/search?token=secret')).toBe(false);
  });
  it.each([undefined, "not-a-uuid", [id], "../../account"])(
    "rejects invalid detail IDs: %s",
    (value) => {
      expect(idParams.safeParse({ id: value }).success).toBe(false);
    },
  );
  it("accepts UUID details and constrains filter input", () => {
    expect(idParams.parse({ id }).id).toBe(id);
    expect(
      catalogParams.safeParse({
        kind: "programs",
        scoreType: "EA",
        universityId: id,
      }).success,
    ).toBe(true);
    expect(catalogParams.safeParse({ scoreType: "invalid" }).success).toBe(
      false,
    );
    expect(questionParams.safeParse({ sort: "POPULAR" }).success).toBe(false);
    expect(
      communityParams.safeParse({ universityId: id, view: "people" }).success,
    ).toBe(true);
  });
  it.each([
    "//evil.test",
    "https://evil.test",
    "/questions/invalid",
    "/profile/edit?token=secret",
    "/community?universityId=invalid",
    "/questions/%2f%2fevil",
    "/questions/new?universityId=x&universityId=y",
  ])("rejects unsafe destinations %s", (value) => {
    expect(isSafeDestination(value)).toBe(false);
    expect(destinationHref(value)).toBe("/");
  });
  it("preserves validated detail and filtered discovery routes after login", () => {
    expect(preserveDestination(`/questions/${id}`, { id })).toBe(
      `/questions/${id}`,
    );
    const destination = preserveDestination("/kesfet", {
      kind: "programs",
      q: "Tıp & sağlık",
      universityId: id,
    });
    expect(isSafeDestination(destination)).toBe(true);
    expect(
      new URL(destination, "https://test.invalid").searchParams.get("q"),
    ).toBe("Tıp & sağlık");
  });
  it("shares actual web routes with Turkish slugs and immutable IDs", () => {
    expect(sharePath("universiteler", id, "İstanbul Üniversitesi")).toBe(
      `https://tanidikvar.com.tr/universite/istanbul-universitesi--${id}`,
    );
    expect(sharePath("sorular", id, "Yurt nasıl?")).toBe(
      `https://tanidikvar.com.tr/soru/yurt-nasil-${id}`,
    );
    expect(sharePath("profil", id)).toBe(
      `https://tanidikvar.com.tr/profiles/${id}`,
    );
  });
});

it('accepts exact notification targets and rejects invalid focus identities',()=>{
 const id='123e4567-e89b-42d3-a456-426614174000';
 expect(isSafeDestination(`/questions/${id}?answerId=${id}`)).toBe(true);
 expect(isSafeDestination(`/answers/${id}/comments?commentId=${id}`)).toBe(true);
 expect(isSafeDestination(`/universities/${id}?tab=polls&contentId=${id}`)).toBe(true);
 expect(isSafeDestination(`/universities/${id}?tab=manager&contentId=${id}`)).toBe(false);
 expect(isSafeDestination(`/questions/${id}?answerId=wrong`)).toBe(false);
});
