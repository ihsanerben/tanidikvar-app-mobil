import { notificationDestination } from './destination';
const id='123e4567-e89b-42d3-a456-426614174000';
it.each([['QUESTION',`/questions/${id}`],['ANSWER',`/answers/${id}/comments`],['UNIVERSITY',`/universities/${id}`],['PROGRAM',`/programs/${id}`],['TANIDIK',`/profiles/${id}`]])('routes %s notifications', (targetType, expected) => {
  expect(notificationDestination({ targetType, targetId:id })).toBe(expected);
});
it('has no route for missing or unsupported targets', () => {
  expect(notificationDestination({ targetType:'QUESTION',targetId:'invalid' })).toBeNull();
  expect(notificationDestination({ targetType:'MANAGER',targetId:id })).toBeNull();
  expect(notificationDestination({ type:'ACHIEVEMENT' })).toBeNull();
});
