import { DomainEvent } from './domain-event';
import { TransactionClient } from '../db/transaction';

export type EventSubscriber<TPayload = unknown> = (
  event: DomainEvent<TPayload>,
  tx?: TransactionClient
) => Promise<void> | void;

/**
 * Lightweight, in-process synchronous Event Bus.
 * Handles event dispatching sequentially.
 *
 * Transaction Safety:
 * - Handlers are run synchronously in-process.
 * - If a handler throws an error, the propagation immediately aborts the active transaction block,
 *   preventing database state mismatch or silent corruption.
 * - For durable, high-throughput systems, this should be replaced with a Transactional Outbox pattern.
 */
export class EventBus {
  private static subscribers: Map<string, EventSubscriber<unknown>[]> = new Map();

  /**
   * Subscribe a callback to a domain event.
   */
  public static subscribe<T = unknown>(eventName: string, subscriber: EventSubscriber<T>): void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }
    this.subscribers.get(eventName)!.push(subscriber as EventSubscriber<unknown>);
  }

  /**
   * Publish a domain event to all registered subscribers sequentially.
   * Propagates errors to ensure transactions fail atomically if a handler fails.
   */
  public static async publish<T = unknown>(event: DomainEvent<T>, tx?: TransactionClient): Promise<void> {
    const handlers = this.subscribers.get(event.name) || [];
    for (const handler of handlers) {
      await handler(event as DomainEvent<unknown>, tx);
    }
  }

  /**
   * Clears all registered subscribers. Primarily used in unit test setup/teardowns.
   */
  public static clear(): void {
    this.subscribers.clear();
  }
}
export default EventBus;
