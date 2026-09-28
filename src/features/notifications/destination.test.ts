import { notificationDestination } from './destination';
import { isSafeDestination } from '@/lib/navigation/destination';
const id='123e4567-e89b-42d3-a456-426614174000';
it.each([['QUESTION',`/questions/${id}`],['ANSWER',`/answers/${id}/comments`],['UNIVERSITY',`/universities/${id}`],['PROGRAM',`/programs/${id}`],['TANIDIK',`/profiles/${id}`]])('routes %s notifications', (targetType, expected) => {
  expect(notificationDestination({ targetType, targetId:id })).toBe(expected);
});

it('opens the matching aggregate metric without exposing an individual contribution', () => {
 const target=notificationDestination({targetType:'METRIC',targetId:id,universityId:id,metricKey:'WEEKLY_STUDY_HOURS'});
 expect(target).toBe(`/universities/${id}?tab=metrics&metricKey=WEEKLY_STUDY_HOURS`);
 expect(isSafeDestination(target!)).toBe(true);
 expect(notificationDestination({targetType:'METRIC',targetId:id,universityId:id,metricKey:'bad&tab=polls'})).toBeNull();
});
it('has no route for missing or unsupported targets', () => {
  expect(notificationDestination({ targetType:'QUESTION',targetId:'invalid' })).toBeNull();
  expect(notificationDestination({ targetType:'MANAGER',targetId:id })).toBeNull();
  expect(notificationDestination({ type:'ACHIEVEMENT' })).toBeNull();
});

it('routes precise answer and comment identities and validates the entire destination',()=>{
 const questionId='223e4567-e89b-42d3-a456-426614174000';
 expect(notificationDestination({targetType:'ANSWER',targetId:id,questionId})).toBe(`/questions/${questionId}?answerId=${id}`);
 expect(notificationDestination({targetType:'ANSWER_COMMENT',targetId:id,answerId:questionId})).toBe(`/answers/${questionId}/comments?commentId=${id}`);
 expect(notificationDestination({targetType:'ACHIEVEMENT',targetId:id,profileId:questionId})).toBe(`/achievements/${questionId}`);
 expect(notificationDestination({targetType:'POLL',targetId:id,universityId:questionId})).toBe(`/universities/${questionId}?tab=polls&contentId=${id}`);
});
