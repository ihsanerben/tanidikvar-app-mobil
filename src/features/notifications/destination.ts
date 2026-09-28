import { z } from 'zod';
import type { Notification } from './api';
const uuid = (id?: string) => z.uuid().safeParse(id).success;
export function notificationDestination(n: Notification): string | null {
  if (n.targetType === 'ACHIEVEMENT' || n.type === 'TITLE_UPGRADED') return uuid(n.profileId) ? `/achievements/${n.profileId}` : '/profil';
  if (!uuid(n.targetId)) return null;
  switch (n.targetType) {
    case 'QUESTION': return `/questions/${n.targetId}`;
    case 'ANSWER': return uuid(n.questionId) ? `/questions/${n.questionId}?answerId=${n.targetId}` : `/answers/${n.targetId}/comments`;
    case 'ANSWER_COMMENT': return uuid(n.answerId) ? `/answers/${n.answerId}/comments?commentId=${n.targetId}` : null;
    case 'UNIVERSITY': return `/universities/${n.targetId}`;
    case 'PROGRAM': return `/programs/${n.targetId}`;
    case 'TANIDIK': return `/profiles/${n.targetId}`;
    case 'METRIC': return uuid(n.universityId) && n.metricKey && /^[A-Z_]+$/.test(n.metricKey) ? `/universities/${n.universityId}?tab=metrics&metricKey=${n.metricKey}` : null;
    case 'POLL': case 'EVALUATION': case 'EXPERIENCE': {
      const tab = { POLL:'polls', EVALUATION:'evaluations', EXPERIENCE:'experiences', METRIC:'metrics' }[n.targetType];
      return uuid(n.universityId) ? `/universities/${n.universityId}?tab=${tab}&contentId=${n.targetId}` : null;
    }
    case 'APPLICATION': return '/profile/application';
    case 'ACCOUNT': return '/profil';
    default: return null;
  }
}
