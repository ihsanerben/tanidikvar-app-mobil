import { profileSchema, applicationSchema, preferenceSchema } from "./schemas";
const id = "123e4567-e89b-42d3-a456-426614174000";
const profile = {
  firstName: "Ada",
  lastName: "Yılmaz",
  educationStatus: "YKS_ADAYI",
  universityId: "",
  programId: "",
  departmentId: "",
  classYear: "",
  graduationYear: "",
  biography: "",
  occupation: "",
  company: "",
  linkedinUrl: "",
  portfolioUrl: "",
};
describe("profile and account rules", () => {
  it("allows candidates and requires catalog selections for students", () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
    expect(
      profileSchema.safeParse({
        ...profile,
        educationStatus: "UNIVERSITE_OGRENCISI",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...profile,
        educationStatus: "UNIVERSITE_OGRENCISI",
        universityId: id,
        programId: id,
        classYear: "8",
      }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...profile,
        educationStatus: "UNIVERSITE_OGRENCISI",
        universityId: id,
        programId: id,
        classYear: "9",
      }).success,
    ).toBe(false);
  });
  it("requires a historical graduation year for graduates", () => {
    const graduate = {
      ...profile,
      educationStatus: "MEZUN",
      universityId: id,
      programId: id,
    };
    expect(profileSchema.safeParse(graduate).success).toBe(false);
    expect(
      profileSchema.safeParse({ ...graduate, graduationYear: "2020" }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...graduate,
        graduationYear: String(new Date().getFullYear() + 1),
      }).success,
    ).toBe(false);
  });
  it.each([
    "javascript:alert(1)",
    "https://user:password@example.test",
    "not a URL",
  ])("rejects unsafe profile links %s", (portfolioUrl) => {
    expect(profileSchema.safeParse({ ...profile, portfolioUrl }).success).toBe(
      false,
    );
  });
  it("limits LinkedIn links to the actual LinkedIn host", () => {
    expect(
      profileSchema.safeParse({
        ...profile,
        linkedinUrl: "https://linkedin.com.evil.test/profile",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...profile,
        linkedinUrl: "https://www.linkedin.com/in/ada",
      }).success,
    ).toBe(true);
  });
  it("validates application text and notification frequency", () => {
    expect(applicationSchema.safeParse({ coverLetter: "short" }).success).toBe(
      false,
    );
    expect(
      preferenceSchema.safeParse({
        inAppEnabled: true,
        emailEnabled: false,
        questionRoutingEnabled: true,
        emailFrequency: "NEVER",
      }).success,
    ).toBe(true);
    expect(
      preferenceSchema.safeParse({
        inAppEnabled: true,
        emailEnabled: false,
        questionRoutingEnabled: true,
        emailFrequency: "sometimes",
      }).success,
    ).toBe(false);
  });
});
