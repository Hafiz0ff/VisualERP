import { createContext, useContext, useReducer, type ReactNode } from 'react'

// ========== BATCHES ==========
export interface Batch {
  id: string
  materialId: string
  materialName: string
  supplier: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalCost: number
  arrivalDate: string
  expiryDate?: string
  warehouse: string
  status: 'active' | 'depleted' | 'expired'
  remaining: number
}

// ========== RAW MATERIALS ==========
export interface RawMaterial {
  id: string; name: string; category: string; unit: string
  warehouseStock: number; workshopStock: number; minStock: number
  costPerUnit: number; status: 'ok' | 'low' | 'critical'
  supplier?: string
  batchIds?: string[]
}

// ========== FINISHED PRODUCTS ==========
export interface FinishedProduct {
  id: string; name: string; packaging: string; unit: string
  stock: number; producedToday: number; producedMonth: number; price: number
}

// ========== RECIPES ==========
export interface RecipeIngredient {
  materialId: string; materialName: string; quantityPerUnit: number; unit: string
}

export interface Recipe {
  id: string; productId: string; productName: string
  ingredients: RecipeIngredient[]; yieldPerBatch: number
}

// ========== PRODUCTION ORDERS ==========
export interface ProductionOrder {
  id: string; date: string; productId: string; productName: string
  recipeId: string; plannedQuantity: number; actualQuantity: number
  responsible: string; status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startDate?: string; endDate?: string
  plannedMaterials: { materialId: string; materialName: string; batchId?: string; quantity: number; unit: string }[]
  actualMaterialsUsed: { materialId: string; materialName: string; batchId?: string; quantity: number; unit: string }[]
}

// ========== TRANSFER ORDERS ==========
export interface TransferOrder {
  id: string; date: string; fromLocation: string; toLocation: string
  items: { materialId: string; materialName: string; batchId?: string; batchName?: string; quantity: number; unit: string }[]
  responsible: string; comment: string
  status: 'pending' | 'completed' | 'cancelled'
}

// ========== INCOMING DOCUMENTS ==========
export interface IncomingDocument {
  id: string; date: string; supplier: string; warehouse: string
  items: { materialId: string; materialName: string; batchId?: string; batchName?: string; quantity: number; unit: string; pricePerUnit: number; total: number }[]
  totalSum: number; comment: string
  status: 'draft' | 'posted' | 'cancelled'
}

// ========== SHIPMENTS ==========
export interface Shipment {
  id: string; date: string; customer: string
  items: { productId: string; productName: string; quantity: number; unit: string; price: number; total: number }[]
  totalSum: number; responsible: string; comment: string
  status: 'draft' | 'shipped' | 'cancelled'
}

// ========== WRITE-OFFS ==========
export interface WriteOff {
  id: string; date: string; type: 'losses' | 'defect' | 'spoilage' | 'inventory' | 'other'
  targetType: 'material' | 'product'
  targetId: string; targetName: string
  batchId?: string; batchName?: string
  quantity: number; unit: string; reason: string
  responsible: string; status: 'draft' | 'posted' | 'cancelled'
}

// ========== AUDIT LOG ==========
export interface AuditLogEntry {
  id: string; timestamp: string; user: string
  action: string; documentType: string; documentId: string
  object: string; oldValue?: string; newValue?: string; status: string
}

const writeOffTypeLabels: Record<WriteOff['type'], string> = {
  losses: 'Технологические потери',
  defect: 'Брак',
  spoilage: 'Порча',
  inventory: 'Инвентаризационная корректировка',
  other: 'Прочее',
}

export { writeOffTypeLabels }

// ========== STATUS HELPERS ==========
const getStatus = (w: number, min: number): RawMaterial['status'] => {
  if (w <= min * 0.5) return 'critical'
  if (w <= min) return 'low'
  return 'ok'
}

// ========== INITIAL BATCHES ==========
const initialBatches: Batch[] = [
  { id: 'B-CEM-240601', materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', supplier: 'ООО "ЕвроЦемент"', quantity: 25, unit: 'т', pricePerUnit: 8400, totalCost: 210000, arrivalDate: '01.06.2024', expiryDate: '01.09.2024', warehouse: 'Основной склад', status: 'active', remaining: 20.5 },
  { id: 'B-CEM-240615', materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', supplier: 'ООО "ЕвроЦемент"', quantity: 15, unit: 'т', pricePerUnit: 8600, totalCost: 129000, arrivalDate: '15.06.2024', expiryDate: '15.09.2024', warehouse: 'Основной склад', status: 'active', remaining: 15 },
  { id: 'B-CEM2-240610', materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', supplier: 'ООО "Лафarge"', quantity: 12, unit: 'т', pricePerUnit: 9100, totalCost: 109200, arrivalDate: '10.06.2024', expiryDate: '10.09.2024', warehouse: 'Основной склад', status: 'active', remaining: 10 },
  { id: 'B-CEM2-240620', materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', supplier: 'ООО "Лафarge"', quantity: 14, unit: 'т', pricePerUnit: 9300, totalCost: 130200, arrivalDate: '20.06.2024', expiryDate: '20.09.2024', warehouse: 'Основной склад', status: 'active', remaining: 12 },
  { id: 'B-SND-240608', materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', supplier: 'ИП Козлов', quantity: 50, unit: 'т', pricePerUnit: 1150, totalCost: 57500, arrivalDate: '08.06.2024', warehouse: 'Основной склад', status: 'active', remaining: 28.3 },
  { id: 'B-SND-240622', materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', supplier: 'ИП Козлов', quantity: 40, unit: 'т', pricePerUnit: 1200, totalCost: 48000, arrivalDate: '22.06.2024', warehouse: 'Основной склад', status: 'active', remaining: 40 },
  { id: 'B-GRP-240612', materialId: 'RM006', materialName: 'Гипс строительный Г-5', supplier: 'ООО "ГипсСтрой"', quantity: 10, unit: 'т', pricePerUnit: 6700, totalCost: 67000, arrivalDate: '12.06.2024', warehouse: 'Основной склад', status: 'active', remaining: 8.2 },
  { id: 'B-MRB-240618', materialId: 'RM005', materialName: 'Мраморная мука', supplier: 'ООО "МинералПлюс"', quantity: 5, unit: 'т', pricePerUnit: 3400, totalCost: 17000, arrivalDate: '18.06.2024', warehouse: 'Основной склад', status: 'active', remaining: 3 },
  { id: 'B-POL-240605', materialId: 'RM008', materialName: 'Полимерная добавка Mapefibre', supplier: 'ООО "ПолимерСнаб"', quantity: 500, unit: 'кг', pricePerUnit: 180, totalCost: 90000, arrivalDate: '05.06.2024', expiryDate: '05.12.2024', warehouse: 'Основной склад', status: 'active', remaining: 350 },
  { id: 'B-CEL-240610', materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', supplier: 'BASF Distribution', quantity: 100, unit: 'кг', pricePerUnit: 310, totalCost: 31000, arrivalDate: '10.06.2024', expiryDate: '10.06.2025', warehouse: 'Основной склад', status: 'active', remaining: 95 },
]

// ========== INITIAL MATERIALS ==========
const initialMaterials: RawMaterial[] = [
  { id: 'RM001', name: 'Цемент ПЦ-400 Д20', category: 'Вяжущие', unit: 'т', warehouseStock: 45.5, workshopStock: 8.2, minStock: 15, costPerUnit: 8500, status: 'ok', supplier: 'ООО "ЕвроЦемент"', batchIds: ['B-CEM-240601', 'B-CEM-240615'] },
  { id: 'RM002', name: 'Цемент ПЦ-500 Д0', category: 'Вяжущие', unit: 'т', warehouseStock: 22.0, workshopStock: 4.5, minStock: 10, costPerUnit: 9200, status: 'ok', supplier: 'ООО "Лафarge"', batchIds: ['B-CEM2-240610', 'B-CEM2-240620'] },
  { id: 'RM003', name: 'Кварцевый песок фр. 0-0,5', category: 'Заполнители', unit: 'т', warehouseStock: 78.3, workshopStock: 15.0, minStock: 20, costPerUnit: 1200, status: 'ok', supplier: 'ИП Козлов', batchIds: ['B-SND-240608', 'B-SND-240622'] },
  { id: 'RM004', name: 'Кварцевый песок фр. 0,5-1,0', category: 'Заполнители', unit: 'т', warehouseStock: 65.0, workshopStock: 12.0, minStock: 15, costPerUnit: 1100, status: 'ok', supplier: 'ИП Козлов' },
  { id: 'RM005', name: 'Мраморная мука', category: 'Заполнители', unit: 'т', warehouseStock: 18.5, workshopStock: 3.0, minStock: 8, costPerUnit: 3500, status: 'ok', supplier: 'ООО "МинералПлюс"', batchIds: ['B-MRB-240618'] },
  { id: 'RM006', name: 'Гипс строительный Г-5', category: 'Вяжущие', unit: 'т', warehouseStock: 8.2, workshopStock: 2.1, minStock: 10, costPerUnit: 6800, status: 'low', supplier: 'ООО "ГипсСтрой"', batchIds: ['B-GRP-240612'] },
  { id: 'RM007', name: 'Известь гашёная', category: 'Вяжущие', unit: 'т', warehouseStock: 5.5, workshopStock: 1.0, minStock: 8, costPerUnit: 4200, status: 'low', supplier: 'ООО "ИзвестьПром"' },
  { id: 'RM008', name: 'Полимерная добавка Mapefibre', category: 'Добавки', unit: 'кг', warehouseStock: 850, workshopStock: 120, minStock: 200, costPerUnit: 185, status: 'ok', supplier: 'ООО "ПолимерСнаб"', batchIds: ['B-POL-240605'] },
  { id: 'RM009', name: 'Пластификатор С-3', category: 'Добавки', unit: 'кг', warehouseStock: 320, workshopStock: 45, minStock: 100, costPerUnit: 95, status: 'ok', supplier: 'ООО "ХимСтрой"' },
  { id: 'RM010', name: 'Гидрофобизатор СТМ-Г', category: 'Добавки', unit: 'кг', warehouseStock: 180, workshopStock: 25, minStock: 50, costPerUnit: 145, status: 'ok', supplier: 'ООО "ГидроХим"' },
  { id: 'RM011', name: 'Зольная добавка', category: 'Добавки', unit: 'кг', warehouseStock: 1200, workshopStock: 200, minStock: 300, costPerUnit: 35, status: 'ok', supplier: 'ТЭЦ-5' },
  { id: 'RM012', name: 'Целлюлозная эфирная добавка', category: 'Добавки', unit: 'кг', warehouseStock: 95, workshopStock: 15, minStock: 80, costPerUnit: 320, status: 'low', supplier: 'BASF Distribution', batchIds: ['B-CEL-240610'] },
  { id: 'RM013', name: 'Мешки бумажные 25 кг', category: 'Упаковка', unit: 'шт', warehouseStock: 2500, workshopStock: 500, minStock: 1000, costPerUnit: 12, status: 'ok', supplier: 'ООО "УпаковкаПлюс"' },
  { id: 'RM014', name: 'Мешки бумажные 30 кг', category: 'Упаковка', unit: 'шт', warehouseStock: 1800, workshopStock: 300, minStock: 800, costPerUnit: 14, status: 'ok', supplier: 'ООО "УпаковкаПлюс"' },
  { id: 'RM015', name: 'Мешки бумажные 50 кг', category: 'Упаковка', unit: 'шт', warehouseStock: 3200, workshopStock: 600, minStock: 1200, costPerUnit: 18, status: 'ok', supplier: 'ООО "УпаковкаПлюс"' },
  { id: 'RM016', name: 'Паллеты деревянные 1200x800', category: 'Упаковка', unit: 'шт', warehouseStock: 45, workshopStock: 12, minStock: 20, costPerUnit: 250, status: 'low', supplier: 'ИП Семёнов' },
  { id: 'RM017', name: 'Стрейч-плёнка', category: 'Упаковка', unit: 'кг', warehouseStock: 28, workshopStock: 5, minStock: 10, costPerUnit: 180, status: 'ok', supplier: 'ООО "ПакМатериалы"' },
  { id: 'RM018', name: 'Пигмент красный железоокисный', category: 'Пигменты', unit: 'кг', warehouseStock: 15, workshopStock: 2, minStock: 10, costPerUnit: 280, status: 'low', supplier: 'Lanxess Russia' },
  { id: 'RM019', name: 'Пигмент жёлтый оксидный', category: 'Пигменты', unit: 'кг', warehouseStock: 22, workshopStock: 3, minStock: 10, costPerUnit: 260, status: 'ok', supplier: 'Lanxess Russia' },
  { id: 'RM020', name: 'Пигмент чёрный углеродный', category: 'Пигменты', unit: 'кг', warehouseStock: 3.5, workshopStock: 0.5, minStock: 5, costPerUnit: 450, status: 'critical', supplier: 'ООО "Карбон"' },
]

// ========== INITIAL PRODUCTS ==========
const initialProducts: FinishedProduct[] = [
  { id: 'FP001', name: 'Штукатурка гипсовая Белая', packaging: 'Мешок 25 кг', unit: 'меш', stock: 450, producedToday: 120, producedMonth: 2850, price: 285 },
  { id: 'FP002', name: 'Штукатурка гипсовая Серая', packaging: 'Мешок 30 кг', unit: 'меш', stock: 320, producedToday: 80, producedMonth: 1920, price: 295 },
  { id: 'FP003', name: 'Шпатлёвка гипсовая финишная', packaging: 'Мешок 25 кг', unit: 'меш', stock: 280, producedToday: 95, producedMonth: 2100, price: 340 },
  { id: 'FP004', name: 'Цементно-песчаная смесь М150', packaging: 'Мешок 50 кг', unit: 'меш', stock: 580, producedToday: 150, producedMonth: 3600, price: 195 },
  { id: 'FP005', name: 'Цементно-песчаная смесь М200', packaging: 'Мешок 50 кг', unit: 'меш', stock: 420, producedToday: 110, producedMonth: 2640, price: 220 },
  { id: 'FP006', name: 'Кладочный раствор М100', packaging: 'Мешок 50 кг', unit: 'меш', stock: 350, producedToday: 85, producedMonth: 1680, price: 185 },
  { id: 'FP007', name: 'Плиточный клей усиленный', packaging: 'Мешок 25 кг', unit: 'меш', stock: 220, producedToday: 65, producedMonth: 1560, price: 375 },
  { id: 'FP008', name: 'Гидроизоляция цементная', packaging: 'Мешок 25 кг', unit: 'меш', stock: 150, producedToday: 40, producedMonth: 960, price: 420 },
  { id: 'FP009', name: 'Наливной пол самовыравнивающийся', packaging: 'Мешок 25 кг', unit: 'меш', stock: 180, producedToday: 55, producedMonth: 1320, price: 390 },
  { id: 'FP010', name: 'Клей для газобетона', packaging: 'Мешок 25 кг', unit: 'меш', stock: 260, producedToday: 70, producedMonth: 1440, price: 310 },
]

// ========== INITIAL RECIPES ==========
const initialRecipes: Recipe[] = [
  { id: 'RC001', productId: 'FP001', productName: 'Штукатурка гипсовая Белая', yieldPerBatch: 1, ingredients: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', quantityPerUnit: 650, unit: 'кг' },
    { materialId: 'RM005', materialName: 'Мраморная мука', quantityPerUnit: 250, unit: 'кг' },
    { materialId: 'RM008', materialName: 'Полимерная добавка Mapefibre', quantityPerUnit: 1.5, unit: 'кг' },
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', quantityPerUnit: 3, unit: 'кг' },
    { materialId: 'RM011', materialName: 'Зольная добавка', quantityPerUnit: 95, unit: 'кг' },
  ]},
  { id: 'RC002', productId: 'FP004', productName: 'Цементно-песчаная смесь М150', yieldPerBatch: 1, ingredients: [
    { materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', quantityPerUnit: 150, unit: 'кг' },
    { materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', quantityPerUnit: 750, unit: 'кг' },
    { materialId: 'RM009', materialName: 'Пластификатор С-3', quantityPerUnit: 3, unit: 'кг' },
    { materialId: 'RM007', materialName: 'Известь гашёная', quantityPerUnit: 50, unit: 'кг' },
    { materialId: 'RM011', materialName: 'Зольная добавка', quantityPerUnit: 45, unit: 'кг' },
  ]},
  { id: 'RC003', productId: 'FP007', productName: 'Плиточный клей усиленный', yieldPerBatch: 1, ingredients: [
    { materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', quantityPerUnit: 400, unit: 'кг' },
    { materialId: 'RM004', materialName: 'Кварцевый песок фр. 0,5-1,0', quantityPerUnit: 500, unit: 'кг' },
    { materialId: 'RM009', materialName: 'Пластификатор С-3', quantityPerUnit: 5, unit: 'кг' },
    { materialId: 'RM008', materialName: 'Полимерная добавка Mapefibre', quantityPerUnit: 2, unit: 'кг' },
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', quantityPerUnit: 1.5, unit: 'кг' },
  ]},
]

// ========== INITIAL PRODUCTION ==========
const initialProduction: ProductionOrder[] = [
  { id: 'PO-2024-0156', date: '25.06.2024', productId: 'FP001', productName: 'Штукатурка гипсовая Белая', recipeId: 'RC001', plannedQuantity: 120, actualQuantity: 120, responsible: 'Петров С.И.', status: 'completed', startDate: '25.06.2024', endDate: '25.06.2024', plannedMaterials: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', quantity: 78.0, unit: 'кг' },
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', quantity: 30.0, unit: 'кг' },
  ], actualMaterialsUsed: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', quantity: 78.0, unit: 'кг' },
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', quantity: 30.0, unit: 'кг' },
    { materialId: 'RM008', materialName: 'Полимерная добавка Mapefibre', quantity: 0.18, unit: 'кг' },
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', quantity: 0.36, unit: 'кг' },
    { materialId: 'RM011', materialName: 'Зольная добавка', quantity: 11.4, unit: 'кг' },
  ]},
  { id: 'PO-2024-0157', date: '25.06.2024', productId: 'FP004', productName: 'Цементно-песчаная смесь М150', recipeId: 'RC002', plannedQuantity: 150, actualQuantity: 150, responsible: 'Сидоров А.В.', status: 'completed', startDate: '25.06.2024', endDate: '25.06.2024', plannedMaterials: [
    { materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', batchId: 'B-CEM-240601', quantity: 22.5, unit: 'кг' },
    { materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', batchId: 'B-SND-240608', quantity: 112.5, unit: 'кг' },
  ], actualMaterialsUsed: [
    { materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', batchId: 'B-CEM-240601', quantity: 22.5, unit: 'кг' },
    { materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', batchId: 'B-SND-240608', quantity: 112.5, unit: 'кг' },
    { materialId: 'RM009', materialName: 'Пластификатор С-3', quantity: 0.45, unit: 'кг' },
    { materialId: 'RM007', materialName: 'Известь гашёная', quantity: 7.5, unit: 'кг' },
    { materialId: 'RM011', materialName: 'Зольная добавка', quantity: 6.75, unit: 'кг' },
  ]},
  { id: 'PO-2024-0158', date: '25.06.2024', productId: 'FP007', productName: 'Плиточный клей усиленный', recipeId: 'RC003', plannedQuantity: 65, actualQuantity: 0, responsible: 'Петров С.И.', status: 'in_progress', startDate: '25.06.2024', plannedMaterials: [
    { materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', batchId: 'B-CEM2-240610', quantity: 26.0, unit: 'кг' },
    { materialId: 'RM004', materialName: 'Кварцевый песок фр. 0,5-1,0', quantity: 32.5, unit: 'кг' },
  ], actualMaterialsUsed: [] },
  { id: 'PO-2024-0159', date: '25.06.2024', productId: 'FP003', productName: 'Шпатлёвка гипсовая финишная', recipeId: 'RC001', plannedQuantity: 95, actualQuantity: 0, responsible: 'Кузнецов М.П.', status: 'planned', plannedMaterials: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', quantity: 61.75, unit: 'кг' },
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', quantity: 23.75, unit: 'кг' },
  ], actualMaterialsUsed: [] },
  { id: 'PO-2024-0160', date: '24.06.2024', productId: 'FP002', productName: 'Штукатурка гипсовая Серая', recipeId: 'RC001', plannedQuantity: 80, actualQuantity: 80, responsible: 'Сидоров А.В.', status: 'completed', startDate: '24.06.2024', endDate: '24.06.2024', plannedMaterials: [], actualMaterialsUsed: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', quantity: 52.0, unit: 'кг' },
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', quantity: 20.0, unit: 'кг' },
    { materialId: 'RM008', materialName: 'Полимерная добавка Mapefibre', quantity: 0.12, unit: 'кг' },
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', batchId: 'B-CEL-240610', quantity: 0.24, unit: 'кг' },
    { materialId: 'RM011', materialName: 'Зольная добавка', quantity: 7.6, unit: 'кг' },
  ]},
]

// ========== INITIAL TRANSFERS ==========
const initialTransfers: TransferOrder[] = [
  { id: 'TR-2024-0089', date: '25.06.2024', fromLocation: 'Основной склад', toLocation: 'Цех №1', items: [
    { materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', batchId: 'B-CEM-240601', batchName: 'B-CEM-240601', quantity: 5, unit: 'т' },
    { materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', batchId: 'B-SND-240608', batchName: 'B-SND-240608', quantity: 8, unit: 'т' },
  ], responsible: 'Иванов К.П.', comment: 'Плановая подача', status: 'completed' },
  { id: 'TR-2024-0090', date: '25.06.2024', fromLocation: 'Основной склад', toLocation: 'Цех №2', items: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', batchName: 'B-GRP-240612', quantity: 2, unit: 'т' },
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', batchName: 'B-MRB-240618', quantity: 1.5, unit: 'т' },
  ], responsible: 'Смирнов А.Д.', comment: 'На производство штукатурки', status: 'completed' },
  { id: 'TR-2024-0091', date: '24.06.2024', fromLocation: 'Основной склад', toLocation: 'Цех №1', items: [
    { materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', batchId: 'B-CEM2-240610', batchName: 'B-CEM2-240610', quantity: 3, unit: 'т' },
    { materialId: 'RM004', materialName: 'Кварцевый песок фр. 0,5-1,0', quantity: 5, unit: 'т' },
  ], responsible: 'Иванов К.П.', comment: '', status: 'completed' },
  { id: 'TR-2024-0092', date: '25.06.2024', fromLocation: 'Основной склад', toLocation: 'Цех №1', items: [
    { materialId: 'RM009', materialName: 'Пластификатор С-3', quantity: 20, unit: 'кг' },
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', batchId: 'B-CEL-240610', batchName: 'B-CEL-240610', quantity: 10, unit: 'кг' },
  ], responsible: 'Смирнов А.Д.', comment: 'Срочно', status: 'pending' },
]

// ========== INITIAL INCOMING ==========
const initialIncoming: IncomingDocument[] = [
  { id: 'IN-2024-0045', date: '22.06.2024', supplier: 'ООО "ЕвроЦемент"', warehouse: 'Основной склад', items: [
    { materialId: 'RM001', materialName: 'Цемент ПЦ-400 Д20', batchId: 'B-CEM-240615', batchName: 'B-CEM-240615', quantity: 15, unit: 'т', pricePerUnit: 8600, total: 129000 },
  ], totalSum: 129000, comment: '', status: 'posted' },
  { id: 'IN-2024-0046', date: '20.06.2024', supplier: 'ООО "Лафarge"', warehouse: 'Основной склад', items: [
    { materialId: 'RM002', materialName: 'Цемент ПЦ-500 Д0', batchId: 'B-CEM2-240620', batchName: 'B-CEM2-240620', quantity: 14, unit: 'т', pricePerUnit: 9300, total: 130200 },
  ], totalSum: 130200, comment: 'Партия с сертификатом', status: 'posted' },
  { id: 'IN-2024-0047', date: '22.06.2024', supplier: 'ИП Козлов', warehouse: 'Основной склад', items: [
    { materialId: 'RM003', materialName: 'Кварцевый песок фр. 0-0,5', batchId: 'B-SND-240622', batchName: 'B-SND-240622', quantity: 40, unit: 'т', pricePerUnit: 1200, total: 48000 },
  ], totalSum: 48000, comment: '', status: 'posted' },
  { id: 'IN-2024-0048', date: '18.06.2024', supplier: 'ООО "ГипсСтрой"', warehouse: 'Основной склад', items: [
    { materialId: 'RM006', materialName: 'Гипс строительный Г-5', batchId: 'B-GRP-240612', batchName: 'B-GRP-240612', quantity: 10, unit: 'т', pricePerUnit: 6700, total: 67000 },
    { materialId: 'RM007', materialName: 'Известь гашёная', quantity: 8, unit: 'т', pricePerUnit: 4100, total: 32800 },
  ], totalSum: 99800, comment: '', status: 'posted' },
  { id: 'IN-2024-0049', date: '20.06.2024', supplier: 'ООО "МинералПлюс"', warehouse: 'Основной склад', items: [
    { materialId: 'RM005', materialName: 'Мраморная мука', batchId: 'B-MRB-240618', batchName: 'B-MRB-240618', quantity: 5, unit: 'т', pricePerUnit: 3400, total: 17000 },
  ], totalSum: 17000, comment: '', status: 'draft' },
  { id: 'IN-2024-0050', date: '25.06.2024', supplier: 'BASF Distribution', warehouse: 'Основной склад', items: [
    { materialId: 'RM012', materialName: 'Целлюлозная эфирная добавка', batchId: 'B-CEL-240610', batchName: 'B-CEL-240610', quantity: 100, unit: 'кг', pricePerUnit: 310, total: 31000 },
  ], totalSum: 31000, comment: 'Срочный заказ', status: 'posted' },
]

// ========== INITIAL SHIPMENTS ==========
const initialShipments: Shipment[] = [
  { id: 'SH-2024-0032', date: '25.06.2024', customer: 'ООО "СтройМаркет"', items: [
    { productId: 'FP001', productName: 'Штукатурка гипсовая Белая', quantity: 200, unit: 'меш', price: 285, total: 57000 },
    { productId: 'FP004', productName: 'Цементно-песчаная смесь М150', quantity: 150, unit: 'меш', price: 195, total: 29250 },
  ], totalSum: 86250, responsible: 'Фёдоров Д.Н.', comment: '', status: 'shipped' },
  { id: 'SH-2024-0033', date: '25.06.2024', customer: 'ИП Николаев', items: [
    { productId: 'FP003', productName: 'Шпатлёвка гипсовая финишная', quantity: 80, unit: 'меш', price: 340, total: 27200 },
    { productId: 'FP007', productName: 'Плиточный клей усиленный', quantity: 50, unit: 'меш', price: 375, total: 18750 },
  ], totalSum: 45950, responsible: 'Фёдоров Д.Н.', comment: '', status: 'shipped' },
  { id: 'SH-2024-0034', date: '24.06.2024', customer: 'ООО "РемСтрой"', items: [
    { productId: 'FP009', productName: 'Наливной пол самовыравнивающийся', quantity: 40, unit: 'меш', price: 390, total: 15600 },
  ], totalSum: 15600, responsible: 'Крылов П.А.', comment: '', status: 'shipped' },
  { id: 'SH-2024-0035', date: '25.06.2024', customer: 'ООО "ТоргСервис"', items: [
    { productId: 'FP002', productName: 'Штукатурка гипсовая Серая', quantity: 120, unit: 'меш', price: 295, total: 35400 },
    { productId: 'FP006', productName: 'Кладочный раствор М100', quantity: 100, unit: 'меш', price: 185, total: 18500 },
  ], totalSum: 53900, responsible: 'Фёдоров Д.Н.', comment: 'Паллетное хранение', status: 'draft' },
]

// ========== INITIAL WRITE-OFFS ==========
const initialWriteOffs: WriteOff[] = [
  { id: 'WO-2024-0012', date: '20.06.2024', type: 'losses', targetType: 'material', targetId: 'RM001', targetName: 'Цемент ПЦ-400 Д20', batchId: 'B-CEM-240601', batchName: 'B-CEM-240601', quantity: 0.2, unit: 'т', reason: 'Рассыпание при перегрузке', responsible: 'Иванов К.П.', status: 'posted' },
  { id: 'WO-2024-0013', date: '22.06.2024', type: 'defect', targetType: 'product', targetId: 'FP001', targetName: 'Штукатурка гипсовая Белая', quantity: 3, unit: 'меш', reason: 'Нарушение герметичности мешка', responsible: 'Петров С.И.', status: 'posted' },
  { id: 'WO-2024-0014', date: '23.06.2024', type: 'inventory', targetType: 'material', targetId: 'RM008', targetName: 'Полимерная добавка Mapefibre', quantity: 2, unit: 'кг', reason: 'Инвентаризация: расхождение', responsible: 'Смирнов А.Д.', status: 'posted' },
  { id: 'WO-2024-0015', date: '24.06.2024', type: 'losses', targetType: 'material', targetId: 'RM003', targetName: 'Кварцевый песок фр. 0-0,5', quantity: 0.5, unit: 'т', reason: 'Остатки на конвейере', responsible: 'Иванов К.П.', status: 'draft' },
  { id: 'WO-2024-0016', date: '25.06.2024', type: 'other', targetType: 'product', targetId: 'FP004', targetName: 'Цементно-песчаная смесь М150', quantity: 5, unit: 'меш', reason: 'Пробные образцы для лаборатории', responsible: 'Сидоров А.В.', status: 'posted' },
]

// ========== INITIAL AUDIT LOG ==========
const initialAuditLog: AuditLogEntry[] = [
  { id: 'AL-0001', timestamp: '25.06.2024 08:15', user: 'admin', action: 'Создан приход сырья', documentType: 'Приход', documentId: 'IN-2024-0050', object: 'Целлюлозная эфирная добавка — 100 кг', status: 'Успешно' },
  { id: 'AL-0002', timestamp: '25.06.2024 08:45', user: 'admin', action: 'Проведена передача в цех', documentType: 'Передача', documentId: 'TR-2024-0089', object: 'Цемент ПЦ-400 + Песок → Цех №1', status: 'Успешно' },
  { id: 'AL-0003', timestamp: '25.06.2024 09:30', user: 'petrov', action: 'Завершено производство', documentType: 'Производство', documentId: 'PO-2024-0156', object: 'Штукатурка гипсовая Белая — 120 меш', status: 'Успешно' },
  { id: 'AL-0004', timestamp: '25.06.2024 10:00', user: 'sidorov', action: 'Запущено производство', documentType: 'Производство', documentId: 'PO-2024-0157', object: 'ЦПС М150 — 150 меш', status: 'Успешно' },
  { id: 'AL-0005', timestamp: '25.06.2024 11:15', user: 'petrov', action: 'Запущено производство', documentType: 'Производство', documentId: 'PO-2024-0158', object: 'Плиточный клей — 65 меш', status: 'В работе' },
  { id: 'AL-0006', timestamp: '25.06.2024 12:00', user: 'fedorov', action: 'Создана отгрузка', documentType: 'Отгрузка', documentId: 'SH-2024-0032', object: 'СтройМаркет — 86 250 ₽', status: 'Успешно' },
  { id: 'AL-0007', timestamp: '25.06.2024 12:30', user: 'fedorov', action: 'Отгружено клиенту', documentType: 'Отгрузка', documentId: 'SH-2024-0032', object: 'СтройМаркет — 350 меш', status: 'Успешно' },
  { id: 'AL-0008', timestamp: '25.06.2024 14:00', user: 'smirnov', action: 'Создано списание', documentType: 'Списание', documentId: 'WO-2024-0014', object: 'Инвентаризация: добавка Mapefibre — 2 кг', status: 'Успешно' },
  { id: 'AL-0009', timestamp: '25.06.2024 14:45', user: 'admin', action: 'Изменён статус прихода', documentType: 'Приход', documentId: 'IN-2024-0049', object: 'Черновик → Проведён', oldValue: 'Черновик', newValue: 'Проведён', status: 'Успешно' },
  { id: 'AL-0010', timestamp: '25.06.2024 15:00', user: 'petrov', action: 'Завершено производство', documentType: 'Производство', documentId: 'PO-2024-0157', object: 'ЦПС М150 — 150 меш', status: 'Успешно' },
  { id: 'AL-0011', timestamp: '24.06.2024 16:30', user: 'sidorov', action: 'Завершено производство', documentType: 'Производство', documentId: 'PO-2024-0160', object: 'Штукатурка гипсовая Серая — 80 меш', status: 'Успешно' },
  { id: 'AL-0012', timestamp: '24.06.2024 17:00', user: 'fedorov', action: 'Отгружена продукция', documentType: 'Отгрузка', documentId: 'SH-2024-0033', object: 'ИП Николаев — 130 меш', status: 'Успешно' },
]

// ========== STATE & REDUCER ==========
interface State {
  rawMaterials: RawMaterial[]
  finishedProducts: FinishedProduct[]
  recipes: Recipe[]
  productionOrders: ProductionOrder[]
  transferOrders: TransferOrder[]
  batches: Batch[]
  incomingDocuments: IncomingDocument[]
  shipments: Shipment[]
  writeOffs: WriteOff[]
  auditLog: AuditLogEntry[]
}

const initialState: State = {
  rawMaterials: initialMaterials,
  finishedProducts: initialProducts,
  recipes: initialRecipes,
  productionOrders: initialProduction,
  transferOrders: initialTransfers,
  batches: initialBatches,
  incomingDocuments: initialIncoming,
  shipments: initialShipments,
  writeOffs: initialWriteOffs,
  auditLog: initialAuditLog,
}

type Action =
  | { type: 'ADD_INCOMING'; payload: Omit<IncomingDocument, 'id' | 'status'> }
  | { type: 'UPDATE_INCOMING_STATUS'; id: string; status: IncomingDocument['status'] }
  | { type: 'ADD_SHIPMENT'; payload: Omit<Shipment, 'id' | 'status'> }
  | { type: 'UPDATE_SHIPMENT_STATUS'; id: string; status: Shipment['status'] }
  | { type: 'ADD_WRITEOFF'; payload: Omit<WriteOff, 'id' | 'status'> }
  | { type: 'UPDATE_WRITEOFF_STATUS'; id: string; status: WriteOff['status'] }
  | { type: 'ADD_TRANSFER'; payload: Omit<TransferOrder, 'id' | 'status'> }
  | { type: 'COMPLETE_TRANSFER'; id: string }
  | { type: 'ADD_PRODUCTION'; payload: Omit<ProductionOrder, 'id' | 'status'> }
  | { type: 'UPDATE_PRODUCTION_STATUS'; id: string; status: ProductionOrder['status'] }
  | { type: 'ADD_RECIPE'; payload: Omit<Recipe, 'id'> }
  | { type: 'DELETE_RECIPE'; id: string }
  | { type: 'ADD_AUDIT'; payload: Omit<AuditLogEntry, 'id'> }

const genId = () => Math.random().toString(36).substring(2, 7).toUpperCase()

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_INCOMING': {
      const newDoc: IncomingDocument = { ...action.payload, id: `IN-2024-${genId()}`, status: 'draft', items: action.payload.items.map((it) => ({ ...it, batchId: it.batchId || `B-${genId()}`, batchName: it.batchName || it.batchId || `B-${genId()}` })) }
      return { ...state, incomingDocuments: [...state.incomingDocuments, newDoc] }
    }
    case 'UPDATE_INCOMING_STATUS':
      return { ...state, incomingDocuments: state.incomingDocuments.map((d) => d.id === action.id ? { ...d, status: action.status } : d) }
    case 'ADD_SHIPMENT': {
      const newShip: Shipment = { ...action.payload, id: `SH-2024-${genId()}`, status: 'draft' }
      return { ...state, shipments: [...state.shipments, newShip] }
    }
    case 'UPDATE_SHIPMENT_STATUS':
      return { ...state, shipments: state.shipments.map((s) => s.id === action.id ? { ...s, status: action.status } : s) }
    case 'ADD_WRITEOFF': {
      const newWO: WriteOff = { ...action.payload, id: `WO-2024-${genId()}`, status: 'draft' }
      return { ...state, writeOffs: [...state.writeOffs, newWO] }
    }
    case 'UPDATE_WRITEOFF_STATUS':
      return { ...state, writeOffs: state.writeOffs.map((w) => w.id === action.id ? { ...w, status: action.status } : w) }
    case 'ADD_TRANSFER': {
      const newOrder: TransferOrder = { ...action.payload, id: `TR-2024-${genId()}`, status: 'pending' }
      return { ...state, transferOrders: [...state.transferOrders, newOrder] }
    }
    case 'COMPLETE_TRANSFER':
      return { ...state, transferOrders: state.transferOrders.map((t) => t.id === action.id ? { ...t, status: 'completed' as const } : t) }
    case 'ADD_PRODUCTION': {
      const newOrder: ProductionOrder = { ...action.payload, id: `PO-2024-${genId()}`, status: 'planned' }
      return { ...state, productionOrders: [...state.productionOrders, newOrder] }
    }
    case 'UPDATE_PRODUCTION_STATUS':
      return { ...state, productionOrders: state.productionOrders.map((o) => o.id === action.id ? { ...o, status: action.status } : o) }
    case 'ADD_RECIPE': {
      const newRecipe: Recipe = { ...action.payload, id: `RC-${genId()}` }
      return { ...state, recipes: [...state.recipes, newRecipe] }
    }
    case 'DELETE_RECIPE':
      return { ...state, recipes: state.recipes.filter((r) => r.id !== action.id) }
    case 'ADD_AUDIT': {
      const newEntry: AuditLogEntry = { ...action.payload, id: `AL-${genId()}` }
      return { ...state, auditLog: [newEntry, ...state.auditLog] }
    }
    default:
      return state
  }
}

const Context = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}

export function useApp() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useDashboardStats(state: State) {
  const producedToday = state.finishedProducts.reduce((s, p) => s + p.producedToday, 0)
  const producedMonth = state.finishedProducts.reduce((s, p) => s + p.producedMonth, 0)
  const lowStockCount = state.rawMaterials.filter((m) => m.status === 'low' || m.status === 'critical').length
  const incomingMonth = state.incomingDocuments.filter((d) => d.status === 'posted').reduce((s, d) => s + d.totalSum, 0)
  const shippedMonth = state.shipments.filter((s) => s.status === 'shipped').reduce((sum, s) => sum + s.totalSum, 0)
  const activeProd = state.productionOrders.filter((o) => o.status === 'in_progress').length
  const pendingDocs = state.incomingDocuments.filter((d) => d.status === 'draft').length + state.shipments.filter((s) => s.status === 'draft').length + state.transferOrders.filter((t) => t.status === 'pending').length
  const writeOffMonth = state.writeOffs.filter((w) => w.status === 'posted').reduce((s, w) => s + w.quantity, 0)
  return {
    rawMaterialsTotal: state.rawMaterials.length,
    rawMaterialsInWorkshop: Math.round(state.rawMaterials.reduce((s, m) => s + m.workshopStock, 0)),
    finishedProductsTotal: state.finishedProducts.reduce((s, p) => s + p.stock, 0),
    producedToday, producedMonth, lowStockCount,
    incomingMonth, shippedMonth, activeProd, pendingDocs, writeOffMonth,
  }
}

export function useLowStockMaterials(state: State) {
  return state.rawMaterials.filter((m) => m.status === 'low' || m.status === 'critical')
}

export { getStatus, genId }
