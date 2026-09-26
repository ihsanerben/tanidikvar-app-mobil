import { developmentApiOrigin } from './development-api-origin';

it.each(['localhost', '127.0.0.1', '[::1]'])('uses the computer LAN host instead of phone loopback %s', host => {
  expect(developmentApiOrigin(`http://${host}:8080`, '192.168.1.10:8081', true, 'development')).toBe('http://192.168.1.10:8080');
});
it.each(['10.0.0.5', '172.16.0.5', '172.31.0.5'])('supports private networks at %s', host => {
  expect(developmentApiOrigin('http://localhost:18080', `${host}:8081`, true, 'development')).toBe(`http://${host}:18080`);
});
it.each([undefined, 'project.exp.direct', '8.8.8.8:8081', '172.32.0.1:8081', '192.168.999.1:8081', 'user:secret@192.168.1.10:8081', 'invalid host'])('does not redirect API traffic to a tunnel or invalid host: %s', host => {
  expect(developmentApiOrigin('http://localhost:8080', host, true, 'development')).toBe('http://localhost:8080');
});
it('preserves explicitly configured remote APIs', () => {
  expect(developmentApiOrigin('https://api.example.test', '192.168.1.10:8081', true, 'development')).toBe('https://api.example.test');
});
it.each(['preview', 'production'])('does not rewrite %s settings', variant => {
  expect(developmentApiOrigin('http://localhost:8080', '192.168.1.10:8081', true, variant)).toBe('http://localhost:8080');
});
it('does not change standalone builds', () => {
  expect(developmentApiOrigin('http://localhost:8080', '192.168.1.10:8081', false, 'development')).toBe('http://localhost:8080');
});
