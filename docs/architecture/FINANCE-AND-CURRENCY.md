# Finance and Currency Assumptions

Finance is not implemented in Phase 0, but the product should be designed so financial capabilities can be added later without refactoring the core model.

## Default Assumptions

- default currency: `TJS`
- possible future support: `RUB`, `USD`
- organization settings should define currency defaults
- monetary values should be stored precisely in later implementation phases

## Future Financial Concepts

### Purchase Price

Inbound stock may later carry purchase price information for cost analysis and valuation.

### Production Cost

Production cost should eventually be derived from:

- material consumption;
- cost layers or valuation rules;
- optional future overhead logic.

### Stock Valuation

The system should be designed to support future valuation strategies, but Phase 0 does not lock them in yet.

Possible future approaches:

- moving average;
- FIFO;
- policy-based per organization.

### Shipment Revenue

Shipments may later carry commercial values used for revenue reporting, margin views, and customer documents.

### Exchange Rates

Multi-currency support is out of scope for MVP, but the design should allow future exchange-rate handling without renaming core entities.

## Boundaries for Early Phases

- Do not implement finance logic yet.
- Do not turn operational modules into accounting modules.
- Keep operational events structured enough for future financial interpretation.
