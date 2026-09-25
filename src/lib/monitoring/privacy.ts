import type { ErrorEvent, Event, TransactionEvent } from '@sentry/react-native';

const safeTags = new Set(['api.code', 'api.status', 'traceId', 'app.variant', 'update.id', 'update.channel']);
export function scrubEvent<T extends Event | ErrorEvent | TransactionEvent>(event: T): T {
  delete event.request; delete event.user; delete event.extra; delete event.logentry;
  if (event.message) event.message = 'Application error';
  event.tags = Object.fromEntries(Object.entries(event.tags ?? {}).filter(([key, value]) => safeTags.has(key) && /^[a-zA-Z0-9_.:-]{1,100}$/.test(String(value))));
  // Navigation, request bodies, view props and form values must never be serialized.
  const contexts = event.contexts;
  event.contexts = Object.fromEntries(Object.entries(contexts ?? {}).filter(([key]) => ['app', 'device', 'os', 'runtime', 'trace'].includes(key)));
  if (event.exception?.values) event.exception.values = event.exception.values.map(value => ({
    type: value.type && /^[a-zA-Z0-9_.]{1,80}$/.test(value.type) ? value.type : 'Error',
    value: 'Application error (details removed)',
    mechanism: value.mechanism ? { type: value.mechanism.type, handled: value.mechanism.handled } : undefined,
    stacktrace: value.stacktrace ? { frames: value.stacktrace.frames?.map(frame => ({
      filename: frame.filename?.split('?')[0], function: frame.function, lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
    })) } : undefined,
  }));
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.filter(b => !b.category?.includes('http') && !b.category?.includes('navigation')).map(b => ({ category: b.category, level: b.level, timestamp: b.timestamp }));
  if (event.transaction) event.transaction = 'mobile-screen';
  return event;
}
export function scrubTransaction(event: TransactionEvent): TransactionEvent {
  scrubEvent(event);
  event.spans = event.spans?.map(span => ({ ...span, description: span.op, data: {} }));
  return event;
}
