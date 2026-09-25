import { z } from 'zod';
import type { Notification } from './api';
export function notificationDestination(notification: Notification): string | null {
  const id = z.uuid().safeParse(notification.targetId);
  if (!id.success) return null;
  switch (notification.targetType) {
    case 'QUESTION': return `/questions/${id.data}`;
    case 'ANSWER': return `/answers/${id.data}/comments`;
    case 'UNIVERSITY': return `/universities/${id.data}`;
    case 'PROGRAM': return `/programs/${id.data}`;
    case 'TANIDIK': return `/profiles/${id.data}`;
    default: return null;
  }
}
