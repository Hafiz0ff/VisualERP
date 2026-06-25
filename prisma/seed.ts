import { PrismaClient, ItemType, LocationType, ModuleKey, WriteOffReason } from '@prisma/client';
import { InventoryAuditsService } from '../src/modules/inventory-audits/inventory-audits.service';
import { ProductionOrdersService } from '../src/modules/production-orders/production-orders.service';
import { PurchaseReceiptsService } from '../src/modules/purchase-receipts/purchase-receipts.service';
import { ShipmentsService } from '../src/modules/shipments/shipments.service';
import { TransfersService } from '../src/modules/transfers/transfers.service';
import { WriteOffsService } from '../src/modules/write-offs/write-offs.service';

const prisma = new PrismaClient();

type IdMap = Record<string, string>;

function dateFromToday(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

function requireMapId(map: IdMap, key: string): string {
  const value = map[key];
  if (!value) {
    throw new Error(`Seed reference "${key}" was not created.`);
  }
  return value;
}

async function resetDemoOperationalData(organizationId: string) {
  console.log('Resetting demo operational data...');

  await prisma.auditLog.deleteMany({ where: { organizationId } });
  await prisma.idempotencyKey.deleteMany({ where: { organizationId } });
  await prisma.stockMovementLine.deleteMany({ where: { stockMovement: { organizationId } } });
  await prisma.stockMovement.deleteMany({ where: { organizationId } });

  await prisma.inventoryAuditLine.deleteMany({ where: { inventoryAudit: { organizationId } } });
  await prisma.inventoryAudit.deleteMany({ where: { organizationId } });

  await prisma.writeOffLine.deleteMany({ where: { writeOff: { organizationId } } });
  await prisma.writeOff.deleteMany({ where: { organizationId } });

  await prisma.shipmentLine.deleteMany({ where: { shipment: { organizationId } } });
  await prisma.shipment.deleteMany({ where: { organizationId } });

  await prisma.finishedGoodsOutput.deleteMany({ where: { organizationId } });
  await prisma.productionConsumption.deleteMany({ where: { organizationId } });
  await prisma.productionOrderLine.deleteMany({ where: { productionOrder: { organizationId } } });
  await prisma.productionOrder.deleteMany({ where: { organizationId } });

  await prisma.transferLine.deleteMany({ where: { transfer: { organizationId } } });
  await prisma.transfer.deleteMany({ where: { organizationId } });

  await prisma.purchaseReceiptLine.deleteMany({ where: { purchaseReceipt: { organizationId } } });
  await prisma.purchaseReceipt.deleteMany({ where: { organizationId } });

  await prisma.stockBatch.deleteMany({ where: { organizationId } });
  await prisma.documentSequence.deleteMany({ where: { organizationId } });
}

async function findBatch(organizationId: string, itemId: string, batchNumber: string) {
  const batch = await prisma.stockBatch.findFirst({
    where: { organizationId, itemId, batchNumber },
  });
  if (!batch) {
    throw new Error(`Expected batch ${batchNumber} was not created.`);
  }
  return batch;
}

async function seedDemoOperationalScenario(input: {
  organizationId: string;
  userId: string;
  unitsMap: IdMap;
  itemsMap: IdMap;
  locationsMap: IdMap;
  suppliersMap: IdMap;
  customersMap: IdMap;
}) {
  const { organizationId, userId, unitsMap, itemsMap, locationsMap, suppliersMap, customersMap } = input;

  console.log('Seeding realistic demo workflow...');

  await resetDemoOperationalData(organizationId);

  const kg = requireMapId(unitsMap, 'kg');
  const pcs = requireMapId(unitsMap, 'pcs');
  const bag = requireMapId(unitsMap, 'bag');

  const whMain = requireMapId(locationsMap, 'WH-MAIN');
  const whFg = requireMapId(locationsMap, 'WH-FG');
  const whQa = requireMapId(locationsMap, 'WH-QA');
  const workshop = requireMapId(locationsMap, 'WS-1');
  const packing = requireMapId(locationsMap, 'WS-PACK');

  const cement = requireMapId(itemsMap, 'MAT-CEM-500');
  const gypsum = requireMapId(itemsMap, 'MAT-GYP-BLD');
  const sand = requireMapId(itemsMap, 'MAT-SND-QRT');
  const limestone = requireMapId(itemsMap, 'MAT-LIM-FLR');
  const polymer = requireMapId(itemsMap, 'MAT-POL-ADD');
  const bag25 = requireMapId(itemsMap, 'PKG-BAG-25');
  const bag30 = requireMapId(itemsMap, 'PKG-BAG-30');
  const film = requireMapId(itemsMap, 'PKG-FILM');
  const adhesive = requireMapId(itemsMap, 'FG-ADH-25');
  const plaster = requireMapId(itemsMap, 'FG-PLST-30');

  const receipt = await PurchaseReceiptsService.create(organizationId, userId, {
    date: dateFromToday(-14),
    supplierId: requireMapId(suppliersMap, 'SUP-GLOBAL'),
    targetLocationId: whMain,
    lines: [
      {
        itemId: cement,
        quantity: 6000,
        unitId: kg,
        batchNumber: 'DEMO-CEM-2026-06-A',
        expirationDate: dateFromToday(240),
        costPerUnit: 0.92,
      },
      {
        itemId: gypsum,
        quantity: 3000,
        unitId: kg,
        batchNumber: 'DEMO-GYP-2026-06-A',
        expirationDate: dateFromToday(180),
        costPerUnit: 0.64,
      },
      {
        itemId: polymer,
        quantity: 350,
        unitId: kg,
        batchNumber: 'DEMO-POL-2026-06-A',
        expirationDate: dateFromToday(365),
        costPerUnit: 18.5,
      },
    ],
  });
  await PurchaseReceiptsService.post(organizationId, receipt.id, userId);

  const sandReceipt = await PurchaseReceiptsService.create(organizationId, userId, {
    date: dateFromToday(-12),
    supplierId: requireMapId(suppliersMap, 'SUP-QUARTZ'),
    targetLocationId: whMain,
    lines: [
      {
        itemId: sand,
        quantity: 9000,
        unitId: kg,
        batchNumber: 'DEMO-SND-2026-06-A',
        expirationDate: dateFromToday(300),
        costPerUnit: 0.31,
      },
      {
        itemId: limestone,
        quantity: 1500,
        unitId: kg,
        batchNumber: 'DEMO-LIM-2026-06-A',
        expirationDate: dateFromToday(300),
        costPerUnit: 0.27,
      },
    ],
  });
  await PurchaseReceiptsService.post(organizationId, sandReceipt.id, userId);

  const packagingReceipt = await PurchaseReceiptsService.create(organizationId, userId, {
    date: dateFromToday(-11),
    supplierId: requireMapId(suppliersMap, 'SUP-PACK'),
    targetLocationId: whMain,
    lines: [
      {
        itemId: bag25,
        quantity: 3000,
        unitId: pcs,
        batchNumber: 'DEMO-BAG25-2026-06-A',
        expirationDate: dateFromToday(540),
        costPerUnit: 1.75,
      },
      {
        itemId: bag30,
        quantity: 1500,
        unitId: pcs,
        batchNumber: 'DEMO-BAG30-2026-06-A',
        expirationDate: dateFromToday(540),
        costPerUnit: 1.95,
      },
      {
        itemId: film,
        quantity: 200,
        unitId: pcs,
        batchNumber: 'DEMO-FILM-2026-06-A',
        expirationDate: dateFromToday(540),
        costPerUnit: 22,
      },
    ],
  });
  await PurchaseReceiptsService.post(organizationId, packagingReceipt.id, userId);

  const draftReceipt = await PurchaseReceiptsService.create(organizationId, userId, {
    date: dateFromToday(2),
    supplierId: requireMapId(suppliersMap, 'SUP-GLOBAL'),
    targetLocationId: whQa,
    lines: [
      {
        itemId: cement,
        quantity: 1200,
        unitId: kg,
        batchNumber: 'DEMO-CEM-PENDING-QA',
        expirationDate: dateFromToday(260),
        costPerUnit: 0.95,
      },
    ],
  });

  const cancelledReceipt = await PurchaseReceiptsService.create(organizationId, userId, {
    date: dateFromToday(-10),
    supplierId: requireMapId(suppliersMap, 'SUP-GLOBAL'),
    targetLocationId: whMain,
    lines: [
      {
        itemId: cement,
        quantity: 100,
        unitId: kg,
        batchNumber: 'DEMO-CEM-CANCELLED',
        expirationDate: dateFromToday(240),
        costPerUnit: 0.9,
      },
    ],
  });
  await PurchaseReceiptsService.post(organizationId, cancelledReceipt.id, userId);
  await PurchaseReceiptsService.cancel(organizationId, cancelledReceipt.id, userId);
  console.log(`Created draft receipt ${draftReceipt.receiptNumber} for incoming QA stock.`);

  const cementBatch = await findBatch(organizationId, cement, 'DEMO-CEM-2026-06-A');
  const gypsumBatch = await findBatch(organizationId, gypsum, 'DEMO-GYP-2026-06-A');
  const sandBatch = await findBatch(organizationId, sand, 'DEMO-SND-2026-06-A');
  const limestoneBatch = await findBatch(organizationId, limestone, 'DEMO-LIM-2026-06-A');
  const polymerBatch = await findBatch(organizationId, polymer, 'DEMO-POL-2026-06-A');
  const bag25Batch = await findBatch(organizationId, bag25, 'DEMO-BAG25-2026-06-A');
  const bag30Batch = await findBatch(organizationId, bag30, 'DEMO-BAG30-2026-06-A');
  const filmBatch = await findBatch(organizationId, film, 'DEMO-FILM-2026-06-A');

  const productionTransfer = await TransfersService.create(organizationId, userId, {
    date: dateFromToday(-9),
    sourceLocationId: whMain,
    targetLocationId: workshop,
    lines: [
      { itemId: cement, quantity: 2500, unitId: kg, batchId: cementBatch.id },
      { itemId: sand, quantity: 4000, unitId: kg, batchId: sandBatch.id },
      { itemId: gypsum, quantity: 1600, unitId: kg, batchId: gypsumBatch.id },
      { itemId: limestone, quantity: 700, unitId: kg, batchId: limestoneBatch.id },
      { itemId: polymer, quantity: 120, unitId: kg, batchId: polymerBatch.id },
      { itemId: bag25, quantity: 600, unitId: pcs, batchId: bag25Batch.id },
      { itemId: bag30, quantity: 500, unitId: pcs, batchId: bag30Batch.id },
    ],
  });
  await TransfersService.post(organizationId, productionTransfer.id, userId);

  const draftTransfer = await TransfersService.create(organizationId, userId, {
    date: dateFromToday(1),
    sourceLocationId: whMain,
    targetLocationId: packing,
    lines: [
      { itemId: film, quantity: 40, unitId: pcs, batchId: filmBatch.id },
    ],
  });

  const cancelledTransfer = await TransfersService.create(organizationId, userId, {
    date: dateFromToday(-8),
    sourceLocationId: whMain,
    targetLocationId: packing,
    lines: [
      { itemId: film, quantity: 12, unitId: pcs, batchId: filmBatch.id },
    ],
  });
  await TransfersService.post(organizationId, cancelledTransfer.id, userId);
  await TransfersService.cancel(organizationId, cancelledTransfer.id, userId);
  console.log(`Created draft transfer ${draftTransfer.transferNumber} for packaging replenishment.`);

  const adhesiveOrder = await ProductionOrdersService.create(organizationId, userId, {
    targetItemId: adhesive,
    plannedQuantity: 120,
    targetUnitId: bag,
    bomId: null,
    workshopLocationId: workshop,
    scheduledDate: dateFromToday(-7),
  });
  await ProductionOrdersService.start(organizationId, adhesiveOrder.id, userId);
  await ProductionOrdersService.complete(organizationId, adhesiveOrder.id, userId, {
    actualQuantity: 120,
    outputBatchNumber: 'DEMO-FG-ADH-2026-06-A',
    outputExpirationDate: dateFromToday(365),
    productionLocationId: whFg,
  });

  const plasterOrder = await ProductionOrdersService.create(organizationId, userId, {
    targetItemId: plaster,
    plannedQuantity: 50,
    targetUnitId: bag,
    bomId: null,
    workshopLocationId: workshop,
    scheduledDate: dateFromToday(-6),
  });
  await ProductionOrdersService.complete(organizationId, plasterOrder.id, userId, {
    actualQuantity: 50,
    outputBatchNumber: 'DEMO-FG-PLST-2026-06-A',
    outputExpirationDate: dateFromToday(300),
    productionLocationId: whFg,
  });

  const inProgressOrder = await ProductionOrdersService.create(organizationId, userId, {
    targetItemId: plaster,
    plannedQuantity: 80,
    targetUnitId: bag,
    bomId: null,
    workshopLocationId: workshop,
    scheduledDate: dateFromToday(0),
  });
  await ProductionOrdersService.start(organizationId, inProgressOrder.id, userId);

  await ProductionOrdersService.create(organizationId, userId, {
    targetItemId: adhesive,
    plannedQuantity: 180,
    targetUnitId: bag,
    bomId: null,
    workshopLocationId: workshop,
    scheduledDate: dateFromToday(3),
  });

  const cancelledOrder = await ProductionOrdersService.create(organizationId, userId, {
    targetItemId: adhesive,
    plannedQuantity: 40,
    targetUnitId: bag,
    bomId: null,
    workshopLocationId: workshop,
    scheduledDate: dateFromToday(-2),
  });
  await ProductionOrdersService.cancel(organizationId, cancelledOrder.id, userId);

  const adhesiveBatch = await findBatch(organizationId, adhesive, 'DEMO-FG-ADH-2026-06-A');
  const plasterBatch = await findBatch(organizationId, plaster, 'DEMO-FG-PLST-2026-06-A');

  const shippedAdhesive = await ShipmentsService.create(organizationId, userId, {
    date: dateFromToday(-4),
    customerId: requireMapId(customersMap, 'CUST-BUILD'),
    sourceLocationId: whFg,
    lines: [
      { itemId: adhesive, quantity: 60, unitId: bag, pricePerUnit: 46, batchId: adhesiveBatch.id },
    ],
  });
  await ShipmentsService.ship(organizationId, shippedAdhesive.id, userId);

  const shippedPlaster = await ShipmentsService.create(organizationId, userId, {
    date: dateFromToday(-3),
    customerId: requireMapId(customersMap, 'CUST-PAMIR'),
    sourceLocationId: whFg,
    lines: [
      { itemId: plaster, quantity: 20, unitId: bag, pricePerUnit: 39, batchId: plasterBatch.id },
    ],
  });
  await ShipmentsService.ship(organizationId, shippedPlaster.id, userId);

  await ShipmentsService.create(organizationId, userId, {
    date: dateFromToday(1),
    customerId: requireMapId(customersMap, 'CUST-DUSH-STROY'),
    sourceLocationId: whFg,
    lines: [
      { itemId: adhesive, quantity: 30, unitId: bag, pricePerUnit: 45, batchId: adhesiveBatch.id },
    ],
  });

  const cancelledShipment = await ShipmentsService.create(organizationId, userId, {
    date: dateFromToday(-2),
    customerId: requireMapId(customersMap, 'CUST-DUSH-STROY'),
    sourceLocationId: whFg,
    lines: [
      { itemId: adhesive, quantity: 5, unitId: bag, pricePerUnit: 45, batchId: adhesiveBatch.id },
    ],
  });
  await ShipmentsService.ship(organizationId, cancelledShipment.id, userId);
  await ShipmentsService.cancel(organizationId, cancelledShipment.id, userId);

  const postedWriteOff = await WriteOffsService.create(organizationId, userId, {
    date: dateFromToday(-2),
    locationId: whFg,
    reason: WriteOffReason.DEFECT,
    description: 'Повреждение упаковки при перекладке готовой продукции.',
    lines: [
      { itemId: adhesive, quantity: 8, unitId: bag, batchId: adhesiveBatch.id },
    ],
  });
  await WriteOffsService.post(organizationId, postedWriteOff.id, userId);

  await WriteOffsService.create(organizationId, userId, {
    date: dateFromToday(0),
    locationId: whFg,
    reason: WriteOffReason.SAMPLE,
    description: 'Образцы для отдела продаж, ожидают подтверждения.',
    lines: [
      { itemId: plaster, quantity: 2, unitId: bag, batchId: plasterBatch.id },
    ],
  });

  const cancelledWriteOff = await WriteOffsService.create(organizationId, userId, {
    date: dateFromToday(-1),
    locationId: whFg,
    reason: WriteOffReason.OTHER,
    description: 'Ошибочно созданный акт списания.',
    lines: [
      { itemId: adhesive, quantity: 1, unitId: bag, batchId: adhesiveBatch.id },
    ],
  });
  await WriteOffsService.post(organizationId, cancelledWriteOff.id, userId);
  await WriteOffsService.cancel(organizationId, cancelledWriteOff.id, userId);

  const approvedAudit = await InventoryAuditsService.create(organizationId, userId, {
    auditDate: dateFromToday(-1),
    locationId: whFg,
  });
  await InventoryAuditsService.count(organizationId, approvedAudit.id, userId, {
    lines: [
      { itemId: adhesive, unitId: bag, batchId: adhesiveBatch.id, actualQuantity: 50 },
      { itemId: plaster, unitId: bag, batchId: plasterBatch.id, actualQuantity: 30 },
    ],
  });
  await InventoryAuditsService.approve(organizationId, approvedAudit.id, userId);

  const countedAudit = await InventoryAuditsService.create(organizationId, userId, {
    auditDate: dateFromToday(0),
    locationId: whMain,
  });
  await InventoryAuditsService.count(organizationId, countedAudit.id, userId, {
    lines: [
      { itemId: film, unitId: pcs, batchId: filmBatch.id, actualQuantity: 200 },
    ],
  });

  await InventoryAuditsService.create(organizationId, userId, {
    auditDate: dateFromToday(2),
    locationId: workshop,
  });

  console.log('Realistic demo workflow seeded successfully.');
}

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Create Industry Profile
  console.log('Seeding Industry Profiles...');
  const dryMixesProfile = await prisma.industryProfile.upsert({
    where: { code: 'dry_mixes' },
    update: {
      name: 'Dry Construction Mixes',
      description: 'Factory profile for dry mortars, plaster, and adhesives production.',
      defaultCategories: ['Raw Materials', 'Packaging', 'Semi-Finished', 'Finished Products', 'Consumables'],
      defaultModules: [ModuleKey.WAREHOUSE, ModuleKey.PRODUCTION, ModuleKey.BOM, ModuleKey.SHIPMENTS, ModuleKey.WRITEOFFS, ModuleKey.REPORTS],
    },
    create: {
      code: 'dry_mixes',
      name: 'Dry Construction Mixes',
      description: 'Factory profile for dry mortars, plaster, and adhesives production.',
      defaultCategories: ['Raw Materials', 'Packaging', 'Semi-Finished', 'Finished Products', 'Consumables'],
      defaultModules: [ModuleKey.WAREHOUSE, ModuleKey.PRODUCTION, ModuleKey.BOM, ModuleKey.SHIPMENTS, ModuleKey.WRITEOFFS, ModuleKey.REPORTS],
    },
  });

  // 2. Create Organization
  console.log('Seeding Organization...');
  const existingOrg = await prisma.organization.findFirst({
    where: { name: 'VisualERP Demo' },
  });

  const demoOrg = existingOrg
    ? await prisma.organization.update({
        where: { id: existingOrg.id },
        data: {
          industryProfileCode: dryMixesProfile.code,
          baseCurrency: 'TJS',
          locale: 'ru',
          timezone: 'Asia/Dushanbe',
          isActive: true,
        },
      })
    : await prisma.organization.create({
        data: {
          name: 'VisualERP Demo',
          industryProfileCode: dryMixesProfile.code,
          baseCurrency: 'TJS',
          locale: 'ru',
          timezone: 'Asia/Dushanbe',
          isActive: true,
        },
      });

  // 3. Create Module Configs
  console.log('Seeding Module Configurations...');
  const modulesToEnable: ModuleKey[] = ['WAREHOUSE', 'PRODUCTION', 'BOM', 'SHIPMENTS', 'WRITEOFFS', 'REPORTS'];
  for (const moduleKey of modulesToEnable) {
    await prisma.moduleConfig.upsert({
      where: {
        organizationId_moduleKey: {
          organizationId: demoOrg.id,
          moduleKey,
        },
      },
      update: { isEnabled: true },
      create: {
        organizationId: demoOrg.id,
        moduleKey,
        isEnabled: true,
      },
    });
  }

  // 4. Create Terminology Configs
  console.log('Seeding Terminology Overrides...');
  const terminologyList = [
    { key: 'Item', labelDefault: 'Item', labelCustom: 'Номенклатура' },
    { key: 'BOM', labelDefault: 'Bill of Materials', labelCustom: 'Рецептура' },
    { key: 'Workshop', labelDefault: 'Workshop', labelCustom: 'Производственный цех' },
    { key: 'Warehouse', labelDefault: 'Warehouse', labelCustom: 'Склад сырья и ГП' },
    { key: 'FinishedProduct', labelDefault: 'Finished Product', labelCustom: 'Готовая продукция' },
  ];
  for (const term of terminologyList) {
    await prisma.terminologyConfig.upsert({
      where: {
        organizationId_key: {
          organizationId: demoOrg.id,
          key: term.key,
        },
      },
      update: {
        labelDefault: term.labelDefault,
        labelCustom: term.labelCustom,
      },
      create: {
        organizationId: demoOrg.id,
        key: term.key,
        labelDefault: term.labelDefault,
        labelCustom: term.labelCustom,
      },
    });
  }

  // 5. Create Permissions
  console.log('Seeding Permissions...');
  const permissionsList = [
    { code: 'items:read', module: 'items', description: 'View item cards and categories' },
    { code: 'items:create', module: 'items', description: 'Create new items and categories' },
    { code: 'items:update', module: 'items', description: 'Modify item details' },
    { code: 'units:manage', module: 'units', description: 'View, create, and manage units and conversion rules' },
    { code: 'locations:read', module: 'locations', description: 'View warehouses and workshops' },
    { code: 'locations:manage', module: 'locations', description: 'Create, edit, and toggle warehouses and workshops' },
    { code: 'purchase_receipts:read', module: 'warehouse', description: 'View purchase receipts' },
    { code: 'purchase_receipts:create', module: 'warehouse', description: 'Create draft purchase receipts' },
    { code: 'purchase_receipts:update', module: 'warehouse', description: 'Edit draft purchase receipts' },
    { code: 'purchase_receipts:post', module: 'warehouse', description: 'Post purchase receipts' },
    { code: 'purchase_receipts:cancel', module: 'warehouse', description: 'Cancel posted purchase receipts' },
    { code: 'transfers:read', module: 'warehouse', description: 'View stock transfers' },
    { code: 'transfers:create', module: 'warehouse', description: 'Create draft stock transfers' },
    { code: 'transfers:update', module: 'warehouse', description: 'Edit draft stock transfers' },
    { code: 'transfers:post', module: 'warehouse', description: 'Post stock transfers' },
    { code: 'transfers:cancel', module: 'warehouse', description: 'Cancel posted stock transfers' },
    { code: 'inventory_audits:read', module: 'warehouse', description: 'View inventory audits' },
    { code: 'inventory_audits:create', module: 'warehouse', description: 'Create draft inventory audits' },
    { code: 'inventory_audits:update', module: 'warehouse', description: 'Edit draft inventory audits' },
    { code: 'inventory_audits:count', module: 'warehouse', description: 'Lock inventory audit counts' },
    { code: 'inventory_audits:approve', module: 'warehouse', description: 'Approve inventory audit adjustments' },
    { code: 'inventory_audits:cancel', module: 'warehouse', description: 'Cancel inventory audits' },
    { code: 'suppliers:manage', module: 'partners', description: 'View and edit supplier directory' },
    { code: 'customers:manage', module: 'partners', description: 'View and edit customer directory' },
    { code: 'boms:read', module: 'bom', description: 'View BOM structures and versions' },
    { code: 'boms:create', module: 'bom', description: 'Create draft BOM versions' },
    { code: 'boms:update', module: 'bom', description: 'Edit draft BOM versions' },
    { code: 'boms:activate', module: 'bom', description: 'Activate BOM versions' },
    { code: 'production_orders:read', module: 'production', description: 'View production orders' },
    { code: 'production_orders:create', module: 'production', description: 'Create planned production orders' },
    { code: 'production_orders:update', module: 'production', description: 'Edit planned production orders' },
    { code: 'production_orders:start', module: 'production', description: 'Start production orders' },
    { code: 'production_orders:complete', module: 'production', description: 'Complete production orders' },
    { code: 'production_orders:cancel', module: 'production', description: 'Cancel production orders' },
    { code: 'shipments:read', module: 'shipments', description: 'View customer shipments' },
    { code: 'shipments:create', module: 'shipments', description: 'Create draft shipments' },
    { code: 'shipments:update', module: 'shipments', description: 'Edit draft shipments' },
    { code: 'shipments:ship', module: 'shipments', description: 'Ship goods to customers' },
    { code: 'shipments:cancel', module: 'shipments', description: 'Cancel shipments' },
    { code: 'write_offs:read', module: 'write_offs', description: 'View write-offs' },
    { code: 'write_offs:create', module: 'write_offs', description: 'Create draft write-offs' },
    { code: 'write_offs:update', module: 'write_offs', description: 'Edit draft write-offs' },
    { code: 'write_offs:post', module: 'write_offs', description: 'Post write-offs' },
    { code: 'write_offs:cancel', module: 'write_offs', description: 'Cancel write-offs' },
    { code: 'stock_reports:read', module: 'stock', description: 'View derived stock balance reports' },
    { code: 'stock_movements:read', module: 'stock', description: 'View historical stock movement ledger records' },
    { code: 'stock_batches:read', module: 'stock', description: 'View stock batch registers and calculated balances' },
    { code: 'dashboard:read', module: 'dashboard', description: 'View dashboard summary payloads' },
    { code: 'audit_log:read', module: 'audit', description: 'Read system audit logs' },
    { code: 'settings:manage', module: 'settings', description: 'Manage company settings and module status' },
  ];

  const dbPermissions = [];
  for (const perm of permissionsList) {
    const createdPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
    dbPermissions.push(createdPerm);
  }

  // 6. Create Roles & Associate Permissions
  console.log('Seeding Roles...');
  const allPermissionCodes = permissionsList.map((p) => p.code);
  const adminPermissionCodes = allPermissionCodes.filter((code) => code !== 'settings:manage');
  const warehousePermissionCodes = [
    'items:read', 'items:create', 'items:update', 'units:manage', 'locations:read', 'locations:manage',
    'purchase_receipts:read', 'purchase_receipts:create', 'purchase_receipts:update', 'purchase_receipts:post', 'purchase_receipts:cancel',
    'transfers:read', 'transfers:create', 'transfers:update', 'transfers:post', 'transfers:cancel',
    'inventory_audits:read', 'inventory_audits:create', 'inventory_audits:update', 'inventory_audits:count', 'inventory_audits:approve', 'inventory_audits:cancel',
    'write_offs:read', 'write_offs:create', 'write_offs:update', 'write_offs:post', 'write_offs:cancel',
    'stock_reports:read', 'stock_movements:read', 'stock_batches:read', 'dashboard:read',
  ];
  const workshopPermissionCodes = [
    'items:read', 'locations:read',
    'transfers:read', 'transfers:create', 'transfers:update', 'transfers:post', 'transfers:cancel',
    'boms:read', 'boms:create', 'boms:update', 'boms:activate',
    'production_orders:read', 'production_orders:create', 'production_orders:update', 'production_orders:start', 'production_orders:complete', 'production_orders:cancel',
    'write_offs:read', 'write_offs:create', 'write_offs:update', 'write_offs:post', 'write_offs:cancel',
    'stock_reports:read', 'stock_movements:read', 'stock_batches:read', 'dashboard:read',
  ];
  const shipmentPermissionCodes = [
    'items:read', 'items:create', 'items:update', 'locations:read',
    'shipments:read', 'shipments:create', 'shipments:update', 'shipments:ship', 'shipments:cancel',
    'customers:manage', 'write_offs:read', 'write_offs:create', 'write_offs:update', 'write_offs:post', 'write_offs:cancel',
    'stock_reports:read', 'stock_movements:read', 'stock_batches:read', 'dashboard:read',
  ];
  const auditorPermissionCodes = [
    'items:read', 'locations:read',
    'purchase_receipts:read', 'transfers:read', 'inventory_audits:read',
    'boms:read', 'production_orders:read', 'shipments:read', 'write_offs:read',
    'stock_reports:read', 'stock_movements:read', 'stock_batches:read',
    'dashboard:read', 'audit_log:read',
  ];

  const roleDefinitions = [
    { name: 'Owner', description: 'Full access to organization controls and logs', isSystem: true, permCodes: allPermissionCodes },
    { name: 'Admin', description: 'General administration and operation access', isSystem: true, permCodes: adminPermissionCodes },
    { name: 'Warehouse Manager', description: 'Logistics and storage management', isSystem: true, permCodes: warehousePermissionCodes },
    { name: 'Workshop Master', description: 'Production planning and execution management', isSystem: true, permCodes: workshopPermissionCodes },
    { name: 'Shipment Manager', description: 'Customer shipment execution access', isSystem: true, permCodes: shipmentPermissionCodes },
    { name: 'Auditor', description: 'Read-only audit and report analysis access', isSystem: true, permCodes: auditorPermissionCodes },
  ];

  const rolesMap: { [key: string]: string } = {};

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: demoOrg.id,
          name: roleDef.name,
        },
      },
      update: {
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        organizationId: demoOrg.id,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });
    rolesMap[roleDef.name] = role.id;

    // Link permissions
    const linkedPerms = dbPermissions.filter(p => roleDef.permCodes.includes(p.code));
    for (const perm of linkedPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // 7. Create Demo User and Link Membership
  console.log('Seeding Demo User...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@visualerp.com' },
    update: {},
    create: {
      email: 'demo@visualerp.com',
      passwordHash: '$2b$10$BCRYPTHASHPLACEHOLDERFORSEEDEDDEMOUSER', // Will be hashed securely in auth phase
      firstName: 'Дмитрий',
      lastName: 'Директор',
      isActive: true,
    },
  });

  await prisma.userOrganizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {
      roleId: rolesMap['Owner'],
    },
    create: {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      roleId: rolesMap['Owner'],
    },
  });

  // 8. Create Measurement Units
  console.log('Seeding Units...');
  const unitList = [
    { symbol: 'kg', name: 'Килограмм', isBaseUnit: true },
    { symbol: 't', name: 'Тонна', isBaseUnit: false },
    { symbol: 'pcs', name: 'Штука', isBaseUnit: true },
    { symbol: 'bag', name: 'Мешок', isBaseUnit: true },
    { symbol: 'pallet', name: 'Поддон', isBaseUnit: false },
  ];

  const unitsMap: { [key: string]: string } = {};
  for (const unitItem of unitList) {
    const unit = await prisma.unit.upsert({
      where: {
        organizationId_symbol: {
          organizationId: demoOrg.id,
          symbol: unitItem.symbol,
        },
      },
      update: {
        name: unitItem.name,
        isBaseUnit: unitItem.isBaseUnit,
      },
      create: {
        organizationId: demoOrg.id,
        symbol: unitItem.symbol,
        name: unitItem.name,
        isBaseUnit: unitItem.isBaseUnit,
      },
    });
    unitsMap[unitItem.symbol] = unit.id;
  }

  // Create conversions
  // 1 ton = 1000 kg
  await prisma.unitConversion.upsert({
    where: {
      organizationId_fromUnitId_toUnitId: {
        organizationId: demoOrg.id,
        fromUnitId: unitsMap['t'],
        toUnitId: unitsMap['kg'],
      },
    },
    update: { factor: 1000.0 },
    create: {
      organizationId: demoOrg.id,
      fromUnitId: unitsMap['t'],
      toUnitId: unitsMap['kg'],
      factor: 1000.0,
    },
  });
  // 1 pallet = 40 bags (for Tile Adhesive)
  await prisma.unitConversion.upsert({
    where: {
      organizationId_fromUnitId_toUnitId: {
        organizationId: demoOrg.id,
        fromUnitId: unitsMap['pallet'],
        toUnitId: unitsMap['bag'],
      },
    },
    update: { factor: 40.0 },
    create: {
      organizationId: demoOrg.id,
      fromUnitId: unitsMap['pallet'],
      toUnitId: unitsMap['bag'],
      factor: 40.0,
    },
  });

  // 9. Create Stock Locations
  console.log('Seeding Stock Locations...');
  const locationsList = [
    { name: 'Центральный склад сырья', code: 'WH-MAIN', type: LocationType.WAREHOUSE },
    { name: 'Склад готовой продукции', code: 'WH-FG', type: LocationType.WAREHOUSE },
    { name: 'Зона карантина и контроля', code: 'WH-QA', type: LocationType.WAREHOUSE },
    { name: 'Смесительный цех N1', code: 'WS-1', type: LocationType.WORKSHOP },
    { name: 'Участок фасовки', code: 'WS-PACK', type: LocationType.WORKSHOP },
  ];

  const locationsMap: { [key: string]: string } = {};
  for (const loc of locationsList) {
    const location = await prisma.stockLocation.upsert({
      where: {
        organizationId_code: {
          organizationId: demoOrg.id,
          code: loc.code,
        },
      },
      update: {
        name: loc.name,
        type: loc.type,
        isActive: true,
      },
      create: {
        organizationId: demoOrg.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        isActive: true,
      },
    });
    locationsMap[loc.code] = location.id;
  }

  // Seeding Sample Partners
  console.log('Seeding Sample Suppliers...');
  const supplierList = [
    {
      code: 'SUP-GLOBAL',
      name: 'Global Raw Materials LLC',
      contactInfo: 'sales@globalraw.example, +992 900 10 20 30',
      taxId: 'SUP-100245',
      notes: 'Цемент, гипс и минеральные добавки. Срок поставки 2-3 дня.',
    },
    {
      code: 'SUP-QUARTZ',
      name: 'Кварц Минерал',
      contactInfo: 'zakaz@quartz.example, +992 900 44 55 66',
      taxId: 'SUP-100312',
      notes: 'Промытый кварцевый песок фракции 0.1-0.6 мм.',
    },
    {
      code: 'SUP-PACK',
      name: 'PackLine Asia',
      contactInfo: 'pack@packline.example, +992 900 77 88 99',
      taxId: 'SUP-100401',
      notes: 'Бумажные мешки, поддоны и упаковочная пленка.',
    },
  ];

  const suppliersMap: IdMap = {};
  for (const supplierItem of supplierList) {
    const supplier = await prisma.supplier.upsert({
      where: {
        organizationId_code: {
          organizationId: demoOrg.id,
          code: supplierItem.code,
        },
      },
      update: {
        name: supplierItem.name,
        contactInfo: supplierItem.contactInfo,
        taxId: supplierItem.taxId,
        notes: supplierItem.notes,
        isActive: true,
      },
      create: {
        organizationId: demoOrg.id,
        ...supplierItem,
        isActive: true,
      },
    });
    suppliersMap[supplierItem.code] = supplier.id;
  }

  console.log('Seeding Sample Customers...');
  const customerList = [
    {
      code: 'CUST-BUILD',
      name: 'BuildTech Solutions',
      contactInfo: 'info@buildtech.example, +992 901 11 22 33',
      taxId: 'CUST-210011',
      notes: 'Регулярный покупатель клея для плитки.',
    },
    {
      code: 'CUST-DUSH-STROY',
      name: 'Душанбе Строй Маркет',
      contactInfo: 'sales@dsm.example, +992 901 44 55 66',
      taxId: 'CUST-210078',
      notes: 'Розничная сеть строительных материалов.',
    },
    {
      code: 'CUST-PAMIR',
      name: 'Pamir Construction Group',
      contactInfo: 'supply@pamirbuild.example, +992 901 77 88 99',
      taxId: 'CUST-210115',
      notes: 'Покупает готовую штукатурку под объектные поставки.',
    },
  ];

  const customersMap: IdMap = {};
  for (const customerItem of customerList) {
    const customer = await prisma.customer.upsert({
      where: {
        organizationId_code: {
          organizationId: demoOrg.id,
          code: customerItem.code,
        },
      },
      update: {
        name: customerItem.name,
        contactInfo: customerItem.contactInfo,
        taxId: customerItem.taxId,
        notes: customerItem.notes,
        isActive: true,
      },
      create: {
        organizationId: demoOrg.id,
        ...customerItem,
        isActive: true,
      },
    });
    customersMap[customerItem.code] = customer.id;
  }

  console.log('Seeding Item Categories...');
  const categoryList = [
    { code: 'CAT-MATERIALS', name: 'Сырье', description: 'Минеральные и химические компоненты производства' },
    { code: 'CAT-PACKAGING', name: 'Упаковка', description: 'Мешки, пленка и вспомогательная тара' },
    { code: 'CAT-FINISHED', name: 'Готовая продукция', description: 'Фасованные строительные смеси' },
    { code: 'CAT-CONSUMABLES', name: 'Расходники', description: 'Материалы для обслуживания цеха' },
  ];

  const categoriesMap: IdMap = {};
  for (const categoryItem of categoryList) {
    const category = await prisma.itemCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: demoOrg.id,
          name: categoryItem.name,
        },
      },
      update: { description: categoryItem.description },
      create: {
        organizationId: demoOrg.id,
        name: categoryItem.name,
        description: categoryItem.description,
      },
    });
    categoriesMap[categoryItem.code] = category.id;
  }

  // 10. Create Sample Items
  console.log('Seeding Sample Items...');
  const itemsList = [
    { name: 'Цемент ПЦ-500 Д0', code: 'MAT-CEM-500', unitSymbol: 'kg', type: ItemType.MATERIAL, categoryCode: 'CAT-MATERIALS' },
    { name: 'Гипс строительный Г-5', code: 'MAT-GYP-BLD', unitSymbol: 'kg', type: ItemType.MATERIAL, categoryCode: 'CAT-MATERIALS' },
    { name: 'Песок кварцевый очищенный', code: 'MAT-SND-QRT', unitSymbol: 'kg', type: ItemType.MATERIAL, categoryCode: 'CAT-MATERIALS' },
    { name: 'Известняковый наполнитель', code: 'MAT-LIM-FLR', unitSymbol: 'kg', type: ItemType.MATERIAL, categoryCode: 'CAT-MATERIALS' },
    { name: 'Полимерная добавка', code: 'MAT-POL-ADD', unitSymbol: 'kg', type: ItemType.MATERIAL, categoryCode: 'CAT-MATERIALS' },
    { name: 'Бумажный мешок 25 кг', code: 'PKG-BAG-25', unitSymbol: 'pcs', type: ItemType.PACKAGING, categoryCode: 'CAT-PACKAGING' },
    { name: 'Бумажный мешок 30 кг', code: 'PKG-BAG-30', unitSymbol: 'pcs', type: ItemType.PACKAGING, categoryCode: 'CAT-PACKAGING' },
    { name: 'Стрейч-пленка для поддонов', code: 'PKG-FILM', unitSymbol: 'pcs', type: ItemType.PACKAGING, categoryCode: 'CAT-PACKAGING' },
    { name: 'Клей плиточный базовый 25 кг', code: 'FG-ADH-25', unitSymbol: 'bag', type: ItemType.FINISHED_PRODUCT, categoryCode: 'CAT-FINISHED' },
    { name: 'Штукатурка гипсовая 30 кг', code: 'FG-PLST-30', unitSymbol: 'bag', type: ItemType.FINISHED_PRODUCT, categoryCode: 'CAT-FINISHED' },
  ];

  const itemsMap: { [key: string]: string } = {};
  for (const it of itemsList) {
    const item = await prisma.item.upsert({
      where: {
        organizationId_code: {
          organizationId: demoOrg.id,
          code: it.code,
        },
      },
      update: {
        name: it.name,
        unitId: unitsMap[it.unitSymbol],
        itemType: it.type,
        categoryId: categoriesMap[it.categoryCode],
        isActive: true,
      },
      create: {
        organizationId: demoOrg.id,
        name: it.name,
        code: it.code,
        unitId: unitsMap[it.unitSymbol],
        categoryId: categoriesMap[it.categoryCode],
        itemType: it.type,
        isActive: true,
      },
    });
    itemsMap[it.code] = item.id;
  }

  // 11. Create Sample BOM for "Tile Adhesive 25kg" (FG-ADH-25)
  console.log('Seeding Sample BOM / Recipe...');
  const bomTileAdhesive = await prisma.bOM.upsert({
    where: {
      organizationId_outputItemId_version: {
        organizationId: demoOrg.id,
        outputItemId: itemsMap['FG-ADH-25'],
        version: '1.0.0',
      },
    },
    update: {
      name: 'Базовый состав клея М-150',
      isActive: true,
      createdByUserId: demoUser.id,
    },
    create: {
      organizationId: demoOrg.id,
      outputItemId: itemsMap['FG-ADH-25'],
      name: 'Базовый состав клея М-150',
      version: '1.0.0',
      isActive: true,
      createdByUserId: demoUser.id,
    },
  });

  await prisma.bOMLine.deleteMany({
    where: { bomId: bomTileAdhesive.id },
  });

  const bomLines = [
    { inputItemCode: 'MAT-CEM-500', quantity: 10.0, unitSymbol: 'kg', wastePercent: 0.5 }, // 10 kg cement
    { inputItemCode: 'MAT-SND-QRT', quantity: 14.7, unitSymbol: 'kg', wastePercent: 1.0 }, // 14.7 kg sand
    { inputItemCode: 'MAT-POL-ADD', quantity: 0.3, unitSymbol: 'kg', wastePercent: 0.0 },  // 0.3 kg polymer
    { inputItemCode: 'PKG-BAG-25',  quantity: 1.0, unitSymbol: 'pcs', wastePercent: 2.0 },  // 1 bag paper
  ];

  for (const line of bomLines) {
    await prisma.bOMLine.create({
      data: {
        bomId: bomTileAdhesive.id,
        inputItemId: itemsMap[line.inputItemCode],
        quantity: line.quantity,
        unitId: unitsMap[line.unitSymbol],
        wastePercent: line.wastePercent,
        notes: `Норма расхода на 1 мешок готовой смеси (25 кг)`,
      },
    });
  }

  const bomGypsumPlaster = await prisma.bOM.upsert({
    where: {
      organizationId_outputItemId_version: {
        organizationId: demoOrg.id,
        outputItemId: itemsMap['FG-PLST-30'],
        version: '1.0.0',
      },
    },
    update: {
      name: 'Гипсовая штукатурка машинного нанесения',
      isActive: true,
      createdByUserId: demoUser.id,
    },
    create: {
      organizationId: demoOrg.id,
      outputItemId: itemsMap['FG-PLST-30'],
      name: 'Гипсовая штукатурка машинного нанесения',
      version: '1.0.0',
      isActive: true,
      createdByUserId: demoUser.id,
    },
  });

  await prisma.bOMLine.deleteMany({
    where: { bomId: bomGypsumPlaster.id },
  });

  const plasterBomLines = [
    { inputItemCode: 'MAT-GYP-BLD', quantity: 22.0, unitSymbol: 'kg', wastePercent: 0.5 },
    { inputItemCode: 'MAT-SND-QRT', quantity: 3.0, unitSymbol: 'kg', wastePercent: 1.0 },
    { inputItemCode: 'MAT-LIM-FLR', quantity: 4.0, unitSymbol: 'kg', wastePercent: 0.0 },
    { inputItemCode: 'MAT-POL-ADD', quantity: 0.2, unitSymbol: 'kg', wastePercent: 0.0 },
    { inputItemCode: 'PKG-BAG-30', quantity: 1.0, unitSymbol: 'pcs', wastePercent: 2.0 },
  ];

  for (const line of plasterBomLines) {
    await prisma.bOMLine.create({
      data: {
        bomId: bomGypsumPlaster.id,
        inputItemId: itemsMap[line.inputItemCode],
        quantity: line.quantity,
        unitId: unitsMap[line.unitSymbol],
        wastePercent: line.wastePercent,
        notes: 'Норма расхода на 1 мешок готовой штукатурки (30 кг)',
      },
    });
  }

  await seedDemoOperationalScenario({
    organizationId: demoOrg.id,
    userId: demoUser.id,
    unitsMap,
    itemsMap,
    locationsMap,
    suppliersMap,
    customersMap,
  });

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
