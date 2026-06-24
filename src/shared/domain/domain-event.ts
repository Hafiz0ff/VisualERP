import { randomUUID } from 'crypto';

export interface DomainEvent<TPayload = unknown> {
  eventId: string;
  name: string;
  timestamp: Date;
  organizationId: string;
  payload: TPayload;
}

export type DomainEventName =
  | 'DocumentCreated'
  | 'DocumentPosted'
  | 'DocumentCancelled'
  | 'StockMovementCreated'
  | 'StockMovementPosted'
  | 'StockMovementCancelled'
  | 'AuditLogCreated';

/**
 * Helper to construct a standard domain event.
 */
export function createDomainEvent<T>(
  name: DomainEventName,
  organizationId: string,
  payload: T
): DomainEvent<T> {
  return {
    eventId: randomUUID(),
    name,
    timestamp: new Date(),
    organizationId,
    payload,
  };
}
