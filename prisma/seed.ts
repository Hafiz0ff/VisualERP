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
    { code: 'core:items:manage', module: 'core', description: 'Create, update, and manage items' },
    { code: 'warehouse:receipts:manage', module: 'warehouse', description: 'Create, post, and cancel purchase receipts' },
    { code: 'warehouse:transfers:manage', module: 'warehouse', description: 'Manage inventory transfers between locations' },
    { code: 'warehouse:audits:manage', module: 'warehouse', description: 'Perform and approve stock audits' },
    { code: 'production:orders:manage', module: 'production', description: 'Plan, start, and complete production orders' },
    { code: 'shipments:manage', module: 'shipments', description: 'Create, post, and cancel customer shipments' },
    { code: 'writeoffs:manage', module: 'writeoffs', description: 'Write off damaged or defect goods' },
    { code: 'settings:manage', module: 'settings', description: 'Manage company settings and module status' },
    { code: 'audit:read', module: 'audit', description: 'Read system audit logs' },
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
  const roleDefinitions = [
    { name: 'Owner', description: 'Full access to organization controls and logs', isSystem: true, permCodes: permissionsList.map(p => p.code) },
    { name: 'Admin', description: 'General administration and operation access', isSystem: true, permCodes: permissionsList.filter(p => p.code !== 'settings:manage').map(p => p.code) },
    { name: 'Warehouse Manager', description: 'Logistics and storage management', isSystem: true, permCodes: ['core:items:manage', 'warehouse:receipts:manage', 'warehouse:transfers:manage', 'warehouse:audits:manage'] },
    { name: 'Workshop Master', description: 'Production planning and execution management', isSystem: true, permCodes: ['production:orders:manage', 'warehouse:transfers:manage'] },
    { name: 'Auditor', description: 'Read-only audit and report analysis access', isSystem: true, permCodes: ['audit:read'] },
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
