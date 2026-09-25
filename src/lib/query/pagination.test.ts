import { nextPage } from './pagination';
describe('pagination boundaries', () => {
 it('continues when there are more server results and stops exactly at the final page', () => {
  expect(nextPage({ size: 20, totalElements: 21 }, [{}])).toBe(1);
  expect(nextPage({ size: 20, totalElements: 21 }, [{}, {}])).toBeUndefined();
  expect(nextPage({ size: 20, totalElements: 20 }, [{}])).toBeUndefined();
  expect(nextPage({ size: 20, totalElements: 0 }, [{}])).toBeUndefined();
 });
 it('does not invent pages when pagination metadata is absent', () => { expect(nextPage({}, [{}])).toBeUndefined(); });
});
