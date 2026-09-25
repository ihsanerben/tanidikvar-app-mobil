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
