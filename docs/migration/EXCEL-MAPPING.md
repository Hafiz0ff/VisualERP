# Excel to VisualERP Mapping

Many real businesses will arrive with operational data already stored in Excel files. This document defines how those spreadsheets may map into VisualERP concepts in future migration work.

## Typical Source Files

Businesses may already keep separate Excel files for:

- items;
- current stock balances;
- suppliers;
- purchase receipts;
- production logs;
- shipments;
- write-offs.

## Mapping Concepts

### Items

Excel columns such as code, name, category, unit, and notes should map to:

- `Item`
- `ItemCategory`
- `Unit`

### Stock Balances

Opening balance sheets should map to:

- storage location;
- item;
- quantity;
- optional batch trace;
- valuation data where available later.

### Suppliers

Supplier sheets may become part of future procurement scope, but for early migration they can at least support receipt references and document history.

### Receipts

Receipt logs should map to inbound stock documents or stock movements with:

- date;
- source document number;
- item;
- quantity;
- destination warehouse.

### Production Records

Production journals should map to:

- `ProductionOrder`
- `ProductionConsumption`
- `FinishedGoodsOutput`

### Shipments

Shipment spreadsheets should map to:

- `Shipment`
- `ShipmentItem`
- outbound stock movement

### Write-offs

Loss and correction sheets should map to:

- `WriteOff`
- `WriteOffItem`
- audit context for who performed the change if known

## Migration Principles

- never assume spreadsheet columns are clean;
- normalize units and item names before import;
- preserve source references where possible;
- log migration assumptions explicitly;
- do not let one company spreadsheet format define the core data model.
