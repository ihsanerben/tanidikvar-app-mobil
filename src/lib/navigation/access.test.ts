import { requiresSession } from './access';
test.each(['/','/kesfet','/questions/123','/universities/123','/programs/123','/profiles/123','/answers/123/comments','/leaderboard'])('public read %s does not require login', path => expect(requiresSession(path)).toBe(false));
test.each(['/profil','/bildirimler','/account','/collection','/close-account','/my-questions','/my-comments','/profile/edit','/questions/new','/questions/123/edit'])('private route %s requires login', path => expect(requiresSession(path)).toBe(true));
