# Stock Ledger Architecture

This document details the stock accounting ledger rules, dynamic balance derivation, and batch resolution strategies for VisualERP, established in **Phase 5**.

---

## 1. Single Source of Truth

VisualERP does **not** maintain mutable stock balance fields in the `Item` or `StockLocation` tables. The absolute source of truth for stock quantities is the transaction log of posted `StockMovementLine` records.

All stock-modifying logic must route through `StockLedgerService` (`src/modules/stock/stock-ledger.service.ts`). Direct database queries mutating stock or circumventing this service are forbidden.

---

## 2. Dynamic Balance Derivation

Stock balances are calculated in real time by summing quantities of incoming lines and subtracting quantities of outgoing lines.

- **Formula**:
  $$\text{Balance} = \sum_{\text{lines with targetLocationId} = L} \text{quantity} - \sum_{\text{lines with sourceLocationId} = L} \text{quantity}$$
- **Scoping**: All sum queries are partitioned by `organizationId` and only sum lines associated with `POSTED` status stock movements.
- **Indices**: Query execution relies on indexes for `organizationId`, item, location, batch, and movement status fields. If balance queries become hot paths, Phase 6+ can add compound indexes or a read-optimized view without changing the ledger source of truth.

---

## 3. Stock Availability Enforcement

Before executing any stock-reducing document (such as a Transfer, Shipment, or Production Consumption), `StockAvailabilityService` asserts that:

$$\text{Available Stock} \ge \text{Requested Quantity}$$

If the available quantity is insufficient, it throws a `ValidationError` and rolls back the transaction.

---

## 4. Batch Allocation Strategies

When stock is consumed, VisualERP resolves which specific batches (`StockBatch`) are modified using one of three strategies:

1. **MANUAL**: The user explicitly passes the `batchId` to consume.
2. **FIFO (First In, First Out)**: Allocates approved stock starting from the oldest received batch (`receivedDate`, with `createdAt` as fallback).
3. **FEFO (First Expired, First Out)**: Allocates approved stock starting from the batch with the earliest `expirationDate`. If no expiration is set, it falls back to oldest received date.
