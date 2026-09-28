import { questionContextLinks } from './question-context';
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const universityId='123e4567-e89b-42d3-a456-426614174000';
const departmentId='223e4567-e89b-42d3-a456-426614174000';
const programId='323e4567-e89b-42d3-a456-426614174000';
it('keeps university and department destinations separate and prefers the canonical program', () => {
  expect(questionContextLinks({universityId,departmentId,programId})).toEqual({
    university:{pathname:'/universities/[id]',params:{id:universityId}},
    department:{pathname:'/programs/[id]',params:{id:programId}},
  });
});
it('keeps historical department questions navigable without a program id', () => {
  expect(questionContextLinks({universityId,departmentId}).department).toEqual({pathname:'/department',params:{universityId,departmentId}});
  expect(questionContextLinks({}).department).toBeUndefined();
});
