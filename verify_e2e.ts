import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.VISUALERP_API_URL || 'http://localhost:3000';
let ORG_ID = '';
let USER_ID = '';
const RUN_ID = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();

interface ApiEnvelope<T> {
  data: T;
}

interface UnitRef {
  id: string;
  symbol: string;
}

interface ItemDto {
  id: string;
  code: string | null;
  name: string;
  unit: UnitRef;
}

interface LocationDto {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'WORKSHOP' | 'TRANSIT' | 'CUSTOMER' | 'SUPPLIER';
  isActive: boolean;
}

interface PartnerDto {
  id: string;
  name: string;
}

interface DocumentDto {
  id: string;
  status: string;
}

interface StockBalanceDto {
  itemId: string;
  locationId: string;
  batchId: string | null;
  batchNumber: string | null;
  quantity: number;
}

interface DashboardDto {
  stockSummary: {
    totalStockItems: number;
  };
  productionSummary: {
    completedCurrentMonthCount: number;
  };
  shipmentSummary: {
    shippedCurrentMonthCount: number;
  };
  recentAuditEvents: {
    summary: string;
  }[];
}

function idempotencyKey(action: string): string {
  return `ve_e2e_${action}_${randomUUID()}`;
}

function batchNumber(prefix: string): string {
  return `${prefix}-${RUN_ID}`;
}

function findBalance(
  balances: StockBalanceDto[],
  item: ItemDto,
  location: LocationDto,
  expectedBatchNumber: string
): StockBalanceDto | undefined {
  return balances.find(
    (balance) =>
      balance.itemId === item.id &&
      balance.locationId === location.id &&
      balance.batchNumber === expectedBatchNumber
  );
}

function sumBalance(balances: StockBalanceDto[], item: ItemDto, location: LocationDto): number {
  return balances
    .filter((balance) => balance.itemId === item.id && balance.locationId === location.id)
    .reduce((sum, balance) => sum + balance.quantity, 0);
}

async function api<T>(method: string, path: string, body?: unknown, idempotencyKeyValue?: string): Promise<T> {
  const headers: Record<string, string> = {
    'X-Organization-Id': ORG_ID,
    'X-User-Id': USER_ID,
  };
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  if (idempotencyKeyValue) {
    headers['Idempotency-Key'] = idempotencyKeyValue;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status} on ${method} ${path}: ${JSON.stringify(errorBody)}`);
  }

  return response.json() as Promise<T>;
}

async function apiData<T>(method: string, path: string, body?: unknown, idempotencyKeyValue?: string): Promise<T> {
  const res = await api<ApiEnvelope<T>>(method, path, body, idempotencyKeyValue);
  return res.data;
}

async function loadBalances(item: ItemDto, location: LocationDto): Promise<StockBalanceDto[]> {
  return apiData<StockBalanceDto[]>(
    'GET',
    `/api/stock/balances?itemId=${item.id}&locationId=${location.id}&pageSize=100`
  );
}

async function run() {
  console.log('=== Starting Programmatic E2E Business Workflow Validation ===');

  const prisma = new PrismaClient();
  try {
    const org = await prisma.organization.findFirst({ where: { name: 'VisualERP Demo' } });
    const user = await prisma.user.findFirst({ where: { email: 'demo@visualerp.com' } });
    if (!org || !user) {
      throw new Error('Could not find seeded Organization or User in database.');
    }
    ORG_ID = org.id;
    USER_ID = user.id;
    console.log(`Resolved ORG_ID: ${ORG_ID}, USER_ID: ${USER_ID}`);
  } finally {
    await prisma.$disconnect();
  }

  // 1. Fetch items
  console.log('1. Loading seeded items...');
  const items = await apiData<ItemDto[]>('GET', '/api/items?pageSize=100');
  const cement = items.find((it) => it.code === 'MAT-CEM-500');
  const sand = items.find((it) => it.code === 'MAT-SND-QRT');
  const polymer = items.find((it) => it.code === 'MAT-POL-ADD');
  const bag = items.find((it) => it.code === 'PKG-BAG-25');
  const adhesive = items.find((it) => it.code === 'FG-ADH-25');

  if (!cement || !sand || !polymer || !bag || !adhesive) {
    throw new Error('Could not find all seeded items (Cement, Sand, Polymer, Bag, Adhesive).');
  }
  console.log('Seeded items verified.');

  // 2. Fetch locations
  console.log('2. Loading seeded locations...');
  const locations = await apiData<LocationDto[]>('GET', '/api/locations');
  const warehouse = locations.find((l) => l.type === 'WAREHOUSE' && l.isActive);
  const workshop = locations.find((l) => l.type === 'WORKSHOP' && l.isActive);

  if (!warehouse || !workshop) {
    throw new Error('Could not find active WAREHOUSE and WORKSHOP locations.');
  }
  console.log(`Using Warehouse: ${warehouse.name}, Workshop: ${workshop.name}`);

  // 3. Fetch supplier & customer
  console.log('3. Loading seeded suppliers and customers...');
  const supplier = (await apiData<PartnerDto[]>('GET', '/api/suppliers'))[0];
  const customer = (await apiData<PartnerDto[]>('GET', '/api/customers'))[0];

  if (!supplier || !customer) {
    throw new Error('Could not find seeded supplier or customer.');
  }
  console.log(`Using Supplier: ${supplier.name}, Customer: ${customer.name}`);

  // 4. Create Purchase Receipt
  console.log('4. Creating draft Purchase Receipt...');
  const cementBatch = batchNumber('BATCH-CEM-E2E');
  const sandBatch = batchNumber('BATCH-SND-E2E');
  const polymerBatch = batchNumber('BATCH-POL-E2E');
  const bagBatch = batchNumber('BATCH-BAG-E2E');
  const adhesiveBatch = batchNumber('BATCH-FG-E2E');

  const prDraft = await apiData<DocumentDto>('POST', '/api/purchase-receipts', {
    date: new Date().toISOString(),
    supplierId: supplier.id,
    targetLocationId: warehouse.id,
    lines: [
      {
        itemId: cement.id,
        quantity: 1000,
        unitId: cement.unit.id,
        batchNumber: cementBatch,
        costPerUnit: 10,
      },
      {
        itemId: sand.id,
        quantity: 1500,
        unitId: sand.unit.id,
        batchNumber: sandBatch,
        costPerUnit: 5,
      },
      {
        itemId: polymer.id,
        quantity: 50,
        unitId: polymer.unit.id,
        batchNumber: polymerBatch,
        costPerUnit: 100,
      },
      {
        itemId: bag.id,
        quantity: 100,
        unitId: bag.unit.id,
        batchNumber: bagBatch,
        costPerUnit: 20,
      },
    ],
  });
  console.log(`Draft Purchase Receipt created with ID: ${prDraft.id}`);

  // 5. Post Purchase Receipt
  console.log('5. Posting Purchase Receipt...');
  const prPosted = await apiData<DocumentDto>('POST', `/api/purchase-receipts/${prDraft.id}/post`, null, idempotencyKey('pr_post'));
  console.log(`Purchase Receipt posted successfully. Status: ${prPosted.status}`);

  let balances = [
    ...(await loadBalances(cement, warehouse)),
    ...(await loadBalances(sand, warehouse)),
    ...(await loadBalances(polymer, warehouse)),
    ...(await loadBalances(bag, warehouse)),
  ];
  console.log('Stock Balances:', JSON.stringify(balances, null, 2));
  const cementBalAfterPR = findBalance(balances, cement, warehouse, cementBatch);
  const sandBalAfterPR = findBalance(balances, sand, warehouse, sandBatch);
  const polymerBalAfterPR = findBalance(balances, polymer, warehouse, polymerBatch);
  const bagBalAfterPR = findBalance(balances, bag, warehouse, bagBatch);
  console.log(`Stock balance of Cement at Warehouse after PR: ${cementBalAfterPR?.quantity || 0} kg`);
  if ((cementBalAfterPR?.quantity || 0) < 1000) {
    throw new Error('Cement stock balance was not increased correctly.');
  }

  // 6. Create Transfer
  console.log('6. Creating draft Transfer to Workshop...');
  if (!cementBalAfterPR?.batchId || !sandBalAfterPR?.batchId || !polymerBalAfterPR?.batchId || !bagBalAfterPR?.batchId) {
    throw new Error('Expected posted purchase receipt balances to include batch IDs.');
  }

  const tfDraft = await apiData<DocumentDto>('POST', '/api/transfers', {
    date: new Date().toISOString(),
    sourceLocationId: warehouse.id,
    targetLocationId: workshop.id,
    lines: [
      {
        itemId: cement.id,
        quantity: 500,
        unitId: cement.unit.id,
        batchId: cementBalAfterPR.batchId,
      },
      {
        itemId: sand.id,
        quantity: 800,
        unitId: sand.unit.id,
        batchId: sandBalAfterPR.batchId,
      },
      {
        itemId: polymer.id,
        quantity: 20,
        unitId: polymer.unit.id,
        batchId: polymerBalAfterPR.batchId,
      },
      {
        itemId: bag.id,
        quantity: 50,
        unitId: bag.unit.id,
        batchId: bagBalAfterPR.batchId,
      },
    ],
  });
  console.log(`Draft Transfer created with ID: ${tfDraft.id}`);

  // 7. Post Transfer
  console.log('7. Posting Transfer...');
  const tfPosted = await apiData<DocumentDto>('POST', `/api/transfers/${tfDraft.id}/post`, null, idempotencyKey('tf_post'));
  console.log(`Transfer posted successfully. Status: ${tfPosted.status}`);

  // Check stock balances in Workshop
  balances = await loadBalances(cement, workshop);
  const cementBalInWorkshop = findBalance(balances, cement, workshop, cementBatch);
  const totalCementInWorkshopBeforeProduction = sumBalance(balances, cement, workshop);
  console.log(`Stock balance of Cement at Workshop after Transfer: ${cementBalInWorkshop?.quantity || 0} kg`);
  if ((cementBalInWorkshop?.quantity || 0) < 500) {
    throw new Error('Cement stock balance at Workshop was not increased correctly.');
  }

  // 8. Create Production Order
  console.log('8. Creating planned Production Order for 20 bags of Tile Adhesive...');
  const poCreated = await apiData<DocumentDto>('POST', '/api/production-orders', {
    targetItemId: adhesive.id,
    plannedQuantity: 20,
    targetUnitId: adhesive.unit.id,
    workshopLocationId: workshop.id,
    scheduledDate: new Date().toISOString(),
    bomId: null, // Auto-resolve active BOM
  });
  console.log(`Planned Production Order created with ID: ${poCreated.id}`);

  // 9. Start Production Order
  console.log('9. Starting Production Order...');
  const poStarted = await apiData<DocumentDto>('POST', `/api/production-orders/${poCreated.id}/start`, null, idempotencyKey('po_start'));
  console.log(`Production Order started. Status: ${poStarted.status}`);

  // 10. Complete Production Order (BOM-based completion)
  console.log('10. Completing Production Order (BOM-based consumption)...');
  const poCompleted = await apiData<DocumentDto>('POST', `/api/production-orders/${poCreated.id}/complete`, {
    actualQuantity: 20,
    outputBatchNumber: adhesiveBatch,
    productionLocationId: warehouse.id, // Store output back in Warehouse
  }, idempotencyKey('po_complete'));
  console.log(`Production Order completed. Status: ${poCompleted.status}`);

  // Verify finished goods and consumed component stock levels
  balances = [
    ...(await loadBalances(cement, workshop)),
    ...(await loadBalances(adhesive, warehouse)),
  ];
  console.log('Stock Balances After PO Completion:', JSON.stringify(balances, null, 2));
  const adhesiveBal = findBalance(balances, adhesive, warehouse, adhesiveBatch);
  console.log(`Stock balance of Finished Adhesive at Warehouse: ${adhesiveBal?.quantity || 0} bags`);
  if ((adhesiveBal?.quantity || 0) < 20) {
    throw new Error('Finished goods stock was not output correctly.');
  }

  const totalCementInWorkshopAfterProduction = sumBalance(balances, cement, workshop);
  // Consumed: 20 bags * 10 kg/bag * 1.005 (0.5% waste) = 201 kg.
  const expectedCement = totalCementInWorkshopBeforeProduction - 201;
  console.log(`Total Cement balance in Workshop: ${totalCementInWorkshopAfterProduction} kg (expected: ${expectedCement} kg)`);
  if (Math.abs(totalCementInWorkshopAfterProduction - expectedCement) > 0.01) {
    throw new Error(`Cement consumption calculation incorrect. Expected ${expectedCement}, got ${totalCementInWorkshopAfterProduction}`);
  }

  // 11. Create Shipment
  console.log('11. Creating draft Customer Shipment...');
  if (!adhesiveBal?.batchId) {
    throw new Error('Expected production output balance to include a finished-goods batch ID.');
  }

  const shDraft = await apiData<DocumentDto>('POST', '/api/shipments', {
    date: new Date().toISOString(),
    customerId: customer.id,
    sourceLocationId: warehouse.id,
    lines: [
      {
        itemId: adhesive.id,
        quantity: 12,
        unitId: adhesive.unit.id,
        pricePerUnit: 250,
        batchId: adhesiveBal.batchId,
      },
    ],
  });
  console.log(`Draft Shipment created with ID: ${shDraft.id}`);

  // 12. Ship the Shipment
  console.log('12. Shipping the Shipment...');
  const shPosted = await apiData<DocumentDto>('POST', `/api/shipments/${shDraft.id}/ship`, null, idempotencyKey('sh_ship'));
  console.log(`Shipment shipped successfully. Status: ${shPosted.status}`);

  // Check stock balances after Shipment
  balances = await loadBalances(adhesive, warehouse);
  const adhesiveBalAfterShip = findBalance(balances, adhesive, warehouse, adhesiveBatch);
  // Remaining: initial - 12
  const expectedAdhesiveAfterShip = (adhesiveBal?.quantity || 0) - 12;
  console.log(`Stock balance of Finished Adhesive at Warehouse after Shipment: ${adhesiveBalAfterShip?.quantity || 0} bags (expected: ${expectedAdhesiveAfterShip} bags)`);
  if ((adhesiveBalAfterShip?.quantity || 0) !== expectedAdhesiveAfterShip) {
    throw new Error(`Adhesive stock balance incorrect after shipment. Expected ${expectedAdhesiveAfterShip}, got ${adhesiveBalAfterShip?.quantity}`);
  }

  // 13. Create Inventory Audit
  console.log('13. Creating draft Inventory Audit...');
  if (!adhesiveBalAfterShip?.batchId) {
    throw new Error('Expected shipped finished-goods balance to include a batch ID for inventory audit.');
  }

  const iaDraft = await apiData<DocumentDto>('POST', '/api/inventory-audits', {
    auditDate: new Date().toISOString(),
    locationId: warehouse.id,
  });
  console.log(`Draft Inventory Audit created with ID: ${iaDraft.id}`);

  // 14. Submit physical counts (Submit counted 10 bags of Adhesive, surplus discrepancy)
  console.log(`14. Submitting physical counts (reporting 10 bags instead of expected ${expectedAdhesiveAfterShip})...`);
  const iaCounted = await apiData<DocumentDto>('POST', `/api/inventory-audits/${iaDraft.id}/count`, {
    lines: [
      {
        itemId: adhesive.id,
        unitId: adhesive.unit.id,
        actualQuantity: 10,
        batchId: adhesiveBalAfterShip.batchId,
      },
    ],
  }, idempotencyKey('ia_count'));
  console.log(`Inventory Audit counted. Status: ${iaCounted.status}`);

  // 15. Approve Inventory Audit discrepancy adjustment
  console.log('15. Approving Inventory Audit adjustments...');
  const iaApproved = await apiData<DocumentDto>('POST', `/api/inventory-audits/${iaDraft.id}/approve`, null, idempotencyKey('ia_approve'));
  console.log(`Inventory Audit approved. Status: ${iaApproved.status}`);

  // Verify stock balances after approval
  balances = await loadBalances(adhesive, warehouse);
  const adhesiveBalAfterAudit = findBalance(balances, adhesive, warehouse, adhesiveBatch);
  console.log(`Final Stock balance of Finished Adhesive at Warehouse after Audit approval: ${adhesiveBalAfterAudit?.quantity || 0} bags`);
  if ((adhesiveBalAfterAudit?.quantity || 0) !== 10) {
    throw new Error(`Adhesive stock balance incorrect after audit. Expected 10, got ${adhesiveBalAfterAudit?.quantity}`);
  }

  // 16. Verify Dashboard data
  console.log('16. Fetching Dashboard metrics...');
  const dashboard = await apiData<DashboardDto>('GET', '/api/dashboard');
  console.log(`Dashboard Stock Summary Items: ${dashboard.stockSummary.totalStockItems}`);
  console.log(`Dashboard Production Completed this month: ${dashboard.productionSummary.completedCurrentMonthCount}`);
  console.log(`Dashboard Shipment count shipped this month: ${dashboard.shipmentSummary.shippedCurrentMonthCount}`);

  // 17. Verify Audit log entries
  console.log('17. Checking Audit Logs...');
  if (dashboard.recentAuditEvents.length < 5) {
    throw new Error('Audit logs did not record the E2E lifecycle actions.');
  }
  console.log('Audit Logs checked successfully.');
  console.log(`Latest activity in logs: ${dashboard.recentAuditEvents[0].summary}`);

  console.log('=== Programmatic E2E Business Workflow Validation PASSED Successfully ===');
}

run().catch((err) => {
  console.error('Validation FAILED:', err);
  process.exit(1);
});
