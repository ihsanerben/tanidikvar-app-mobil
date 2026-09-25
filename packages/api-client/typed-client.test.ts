import { createTypedClient } from './typed-client';

describe('typed auth transport', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends login JSON without credentials and authenticates bodyless logout-all', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'access', refreshToken: 'refresh' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const api = createTypedClient('https://api.example.test', {
      getAccessToken: () => 'access',
      refresh: async () => null,
      invalidate: async () => undefined,
      getGeneration: () => 1,
    });
    const body = { email: 'member@example.test', password: 'Test-password-123!' };

    await expect(api.post('/api/auth/mobile/login', body)).resolves.toHaveProperty('accessToken', 'access');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'POST', credentials: 'omit', body: JSON.stringify(body) });
    expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');

    await expect(api.post('/api/me/logout-all', undefined, true)).resolves.toBeUndefined();
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer access' } });
    expect(fetcher.mock.calls[1][1]?.body).toBeUndefined();
  });
});
