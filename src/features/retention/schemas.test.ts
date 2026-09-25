import {
  collectionParams,
  leaderboardParams,
  reportParams,
  showcaseSchema,
} from "./schemas";
import {
  isSafeDestination,
  preserveDestination,
} from "@/lib/navigation/destination";
const id = "123e4567-e89b-42d3-a456-426614174000";
describe("retention navigation and choices", () => {
  it("preserves filters and login return paths while rejecting unsafe parameters", () => {
    const path = `/leaderboard?period=WEEKLY&universityId=${id}`;
    expect(
      preserveDestination("/leaderboard", {
        period: "WEEKLY",
        universityId: id,
      }),
    ).toBe(path);
    expect(isSafeDestination(path)).toBe(true);
    expect(isSafeDestination("/collection?kind=saved")).toBe(true);
    expect(isSafeDestination(`/annual-report/${id}?year=2025`)).toBe(true);
    expect(isSafeDestination(`/achievements/${id}`)).toBe(true);
    for (const path of [
      "/collection?kind=ANSWER",
      "/leaderboard?period=INVALID",
      `/leaderboard?departmentId=${id}`,
      `/annual-report/${id}?year=2099`,
      `/annual-report/${id}?id=${id}`,
      "/leaderboard?universityId=https://evil.test",
    ])
      expect(isSafeDestination(path)).toBe(false);
  });
  it("validates period, identifiers and annual report bounds", () => {
    expect(collectionParams.parse({}).kind).toBe("follows");
    expect(leaderboardParams.safeParse({ period: ["DAILY"] }).success).toBe(
      false,
    );
    expect(
      leaderboardParams.safeParse({ universityId: id, departmentId: id })
        .success,
    ).toBe(true);
    expect(reportParams.safeParse({ id, year: "2019" }).success).toBe(false);
    expect(reportParams.safeParse({ id, year: "2025.0" }).success).toBe(false);
    expect(
      reportParams.safeParse({ id, year: String(new Date().getFullYear()) })
        .success,
    ).toBe(true);
  });
  it("allows clearing the showcase but rejects duplicate or more than three badges", () => {
    expect(showcaseSchema.safeParse({ achievementIds: [] }).success).toBe(true);
    expect(showcaseSchema.safeParse({ achievementIds: [id, id] }).success).toBe(
      false,
    );
    expect(
      showcaseSchema.safeParse({
        achievementIds: Array.from(
          { length: 4 },
          (_, n) => id.slice(0, -1) + n,
        ),
      }).success,
    ).toBe(false);
  });
});
