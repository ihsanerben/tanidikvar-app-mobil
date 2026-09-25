import { actionParamsSchema, loginSchema, registerSchema, resetSchema, returnToSchema } from './schemas';
describe('auth schemas', () => {
  it('rejects multi-byte passwords exceeding backend bcrypt limits', () => {
    expect(registerSchema.safeParse({ email: 'test@example.test', password: 'ş'.repeat(40) }).success).toBe(false);
  });
  it('permits existing short login passwords but requires eight characters at registration', () => {
    const values = { email: 'test@example.test', password: 'short' };
    expect(loginSchema.safeParse(values).success).toBe(true);
    expect(registerSchema.safeParse(values).success).toBe(false);
  });
  it('validates every action token input and rejects arrays', () => {
    expect(actionParamsSchema.safeParse({ token: 'a'.repeat(43) }).success).toBe(true);
    expect(actionParamsSchema.safeParse({ token: ['a'.repeat(43)] }).success).toBe(false);
    expect(resetSchema.safeParse({ token: 'invalid', password: 'Valid-password' }).success).toBe(false);
  });
  it.each(['https://attacker.test', '//attacker.test', '/manager', '/profil?token=x'])('rejects unsafe return destinations: %s', returnTo => {
    expect(returnToSchema.safeParse(returnTo).success).toBe(false);
  });
});
