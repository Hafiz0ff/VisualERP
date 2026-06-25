import { PrismaClient, ItemType, LocationType, BatchStatus, ModuleKey } from '@prisma/client';

const prisma = new PrismaClient();

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
    { symbol: 'kg', name: 'Kilogram', isBaseUnit: true },
    { symbol: 't', name: 'Ton', isBaseUnit: false },
    { symbol: 'pcs', name: 'Piece', isBaseUnit: true },
    { symbol: 'bag', name: 'Bag', isBaseUnit: true }, // base unit for adhesive/plaster packaging in manufacturing
    { symbol: 'pallet', name: 'Pallet', isBaseUnit: false },
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
    { name: 'Main Warehouse', code: 'WH-MAIN', type: LocationType.WAREHOUSE },
    { name: 'Workshop 1', code: 'WS-1', type: LocationType.WORKSHOP },
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

  // 10. Create Sample Items
  console.log('Seeding Sample Items...');
  const itemsList = [
    { name: 'Цемент ПЦ-500', code: 'MAT-CEM-500', unitSymbol: 'kg', type: ItemType.MATERIAL },
    { name: 'Гипс строительный', code: 'MAT-GYP-BLD', unitSymbol: 'kg', type: ItemType.MATERIAL },
    { name: 'Песок кварцевый очищенный', code: 'MAT-SND-QRT', unitSymbol: 'kg', type: ItemType.MATERIAL },
    { name: 'Полимерная добавка (пластификатор)', code: 'MAT-POL-ADD', unitSymbol: 'kg', type: ItemType.MATERIAL },
    { name: 'Бумажный мешок 25кг', code: 'PKG-BAG-25', unitSymbol: 'pcs', type: ItemType.PACKAGING },
    { name: 'Клей плиточный базовый 25кг', code: 'FG-ADH-25', unitSymbol: 'bag', type: ItemType.FINISHED_PRODUCT },
    { name: 'Штукатурка гипсовая 30кг', code: 'FG-PLST-30', unitSymbol: 'bag', type: ItemType.FINISHED_PRODUCT },
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
        isActive: true,
      },
      create: {
        organizationId: demoOrg.id,
        name: it.name,
        code: it.code,
        unitId: unitsMap[it.unitSymbol],
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
