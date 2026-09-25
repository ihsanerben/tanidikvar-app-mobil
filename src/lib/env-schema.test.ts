import { environmentSchema } from './env-schema';
it.each(['preview','production'])('requires HTTPS in %s', variant => {
  expect(environmentSchema.safeParse({ EXPO_PUBLIC_APP_VARIANT:variant,EXPO_PUBLIC_API_URL:'http://api.example.test' }).success).toBe(false);
});
it.each(['https://user:secret@api.example.test','https://api.example.test?token=secret','https://api.example.test/api','file:///etc/passwd'])('rejects unsafe API origins %s', url => {
  expect(environmentSchema.safeParse({ EXPO_PUBLIC_API_URL:url }).success).toBe(false);
});
it('supports local HTTP only in development', () => {
  expect(environmentSchema.safeParse({ EXPO_PUBLIC_API_URL:'http://localhost:8080' }).success).toBe(true);
});
