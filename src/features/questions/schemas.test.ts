import {
  questionSchema,
  bodySchema,
  commentSchema,
  reportSchema,
} from "./schemas";
const id = "123e4567-e89b-42d3-a456-426614174000";
const draft = {
  title: "Üniversite hayatı nasıl?",
  body: "",
  scope: "GENERAL",
  universityId: "",
  programId: "",
  departmentId: "",
  tagIds: [],
};
describe("question and discussion forms", () => {
  it("requires catalog context only for scoped questions", () => {
    expect(questionSchema.safeParse(draft).success).toBe(true);
    expect(
      questionSchema.safeParse({ ...draft, scope: "UNIVERSITY" }).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse({
        ...draft,
        scope: "UNIVERSITY",
        universityId: id,
      }).success,
    ).toBe(true);
    expect(
      questionSchema.safeParse({
        ...draft,
        scope: "UNIVERSITY_DEPARTMENT",
        universityId: id,
      }).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse({
        ...draft,
        scope: "UNIVERSITY_DEPARTMENT",
        universityId: id,
        programId: id,
      }).success,
    ).toBe(true);
  });
  it("preserves legacy department selections and rejects malformed IDs", () => {
    expect(
      questionSchema.safeParse({
        ...draft,
        scope: "UNIVERSITY_DEPARTMENT",
        universityId: id,
        departmentId: id,
      }).success,
    ).toBe(true);
    expect(
      questionSchema.safeParse({
        ...draft,
        scope: "UNIVERSITY",
        universityId: "anything",
      }).success,
    ).toBe(false);
  });
  it("enforces server length and tag limits", () => {
    expect(
      questionSchema.safeParse({ ...draft, tagIds: Array(6).fill(id) }).success,
    ).toBe(false);
    expect(bodySchema.safeParse({ body: "short" }).success).toBe(false);
    expect(bodySchema.safeParse({ body: "a".repeat(5001) }).success).toBe(
      false,
    );
    expect(commentSchema.safeParse({ body: "a" }).success).toBe(false);
    expect(reportSchema.safeParse({ reason: "short" }).success).toBe(false);
  });
});
