# Offline Sync Concept

Offline capability is a future feature, especially important for warehouses and workshops where internet access may be unstable or intermittent.

## Why It Matters

Operational users often work in areas where:

- Wi-Fi is weak;
- mobile connectivity is unstable;
- devices are shared;
- data entry must continue even when sync is delayed.

## Future Concept

VisualERP should support a controlled offline mode for selected workflows, especially:

- stock counting;
- simple warehouse receipts;
- transfers;
- production confirmations;
- shipment confirmation in constrained environments.

## Core Building Blocks

### Local Queue

Offline actions should be recorded in a local queue until connectivity returns.

The queue should keep:

- action type;
- payload snapshot;
- local timestamp;
- actor context;
- sync status.

### Conflict Handling

Conflicts are expected when the same stock or document is changed in multiple places.

The future strategy should include:

- optimistic submission where possible;
- conflict detection on sync;
- user-visible resolution states;
- rules for server-wins, client-wins, or manual review depending on operation type.

### Sync Status

Users must be able to see whether their device or screen is:

- online and synced;
- offline with queued operations;
- syncing;
- blocked by conflicts or failed pushes.

### Last Synced Time

Each relevant view should expose a `last synced time` so users understand data freshness.

### Future Mobile Support

Offline sync design should leave room for:

- mobile warehouse workflows;
- handheld barcode / QR scanning;
- lightweight workshop confirmation flows.

## Constraints

- Offline mode should not silently bypass permissions.
- Auditability must be preserved even for delayed actions.
- High-risk operations may remain online-only in early versions.
- Final offline strategy should be specified after the core domain model and API contracts are stable.
