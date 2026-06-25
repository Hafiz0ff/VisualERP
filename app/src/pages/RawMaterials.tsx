import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Search, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapRawMaterials } from '../api/mappers/items.mapper'
import { mapStockBatches } from '../api/mappers/stock.mapper'
import type { Item, StockBalanceRow, StockBatch } from '../api/types'

export interface RawMaterial {
  id: string
  name: string
  category: string
  unit: string
  warehouseStock: number
  workshopStock: number
  minStock: number | null
  costPerUnit: number | null
  status: 'ok' | 'low' | 'critical' | 'not_configured'
  supplier?: string
  batchIds?: string[]
}

export default function RawMaterials() {
  const { data: itemsRes, loading: loadingItems, error: errorItems, refetch: refetchItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 100 } })
  const { data: balancesRes, loading: loadingBalances, error: errorBalances, refetch: refetchBalances } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: batchesRes, loading: loadingBatches, error: errorBatches, refetch: refetchBatches } = useApiQuery<{ data: StockBatch[] }>('/api/stock/batches')

  const loading = loadingItems || loadingBalances || loadingBatches
  const error = errorItems || errorBalances || errorBatches
  const refetch = () => {
    refetchItems()
    refetchBalances()
    refetchBatches()
  }

  const [view, setView] = useState<'summary' | 'batches'>('summary')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [sortField, setSortField] = useState<keyof RawMaterial | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const rawMaterialsOnly = (itemsRes?.data || []).filter((item) =>
    ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(item.itemType)
  )

  const rawMaterials = mapRawMaterials(rawMaterialsOnly, balancesRes?.data || [])
  const batches = mapStockBatches(batchesRes?.data || [])

  const cats = Array.from(new Set(rawMaterials.map((m) => m.category)))

  const filtered = rawMaterials
    .filter((m) => (m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'all' || m.category === catFilter))
    .sort((a, b) => {
      if (!sortField) return 0
      const av = a[sortField], bv = b[sortField]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  const filteredBatches = batches.filter((b) => b.materialName.toLowerCase().includes(search.toLowerCase()) && (catFilter === 'all' || rawMaterials.find((m) => m.id === b.materialId)?.category === catFilter))

  const hSort = (f: keyof RawMaterial) => { if (sortField === f) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDir('asc') } }

  if (loading) {
    return (
      <Layout title="Склад сырья">
        <div className="bg-white border border-[#D4CFC8] p-4 mb-4 animate-pulse h-16 rounded" />
        <div className="bg-white border border-[#D4CFC8] rounded p-8 animate-pulse flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-[#EFEBE6] rounded w-full" />
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Склад сырья">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить данные склада сырья</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Склад сырья">
      {/* Toolbar */}
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
          <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-9 pr-3 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 px-3 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded">
          <option value="all">Все категории</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex border border-[#D4CFC8] rounded overflow-hidden ml-auto">
          <button onClick={() => setView('summary')} className={`h-9 px-3 text-[12px] font-medium ${view === 'summary' ? 'bg-[#C0563F] text-white' : 'bg-white text-[#5E5E5E] hover:bg-[#F6F5F2]'}`}>По сырью</button>
          <button onClick={() => setView('batches')} className={`h-9 px-3 text-[12px] font-medium ${view === 'batches' ? 'bg-[#C0563F] text-white' : 'bg-white text-[#5E5E5E] hover:bg-[#F6F5F2]'}`}>По партиям</button>
        </div>
      </div>

      {view === 'summary' ? (
        <div className="bg-white border border-[#D4CFC8]">
          <div className="overflow-x-auto">
            <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
              {[{ k: 'id' as const, l: 'Артикул' }, { k: 'name' as const, l: 'Наименование' }, { k: 'category' as const, l: 'Категория' }, { k: 'supplier' as const, l: 'Поставщик' },
              { k: 'unit' as const, l: 'Ед.', c: 'center' }, { k: 'warehouseStock' as const, l: 'На складе', c: 'right' }, { k: 'workshopStock' as const, l: 'В цехе', c: 'right' },
              { k: 'minStock' as const, l: 'Мин.', c: 'right' }, { k: 'costPerUnit' as const, l: 'Себест.', c: 'right' }, { k: 'status' as const, l: 'Статус', c: 'center' }]
                .map((c) => (
                  <th key={c.k} onClick={() => hSort(c.k)} className={`px-4 py-3 text-[12px] font-semibold text-[#2B2B2B] border-b-2 border-[#2B2B2B] cursor-pointer ${c.c === 'right' ? 'text-right' : c.c === 'center' ? 'text-center' : 'text-left'}`}>
                    <div className={`flex items-center gap-1 ${c.c === 'right' ? 'justify-end' : c.c === 'center' ? 'justify-center' : ''}`}>{c.l} {c.k !== 'status' && <ArrowUpDown size={11} className="text-[#9E9E9E]" />}</div>
                  </th>
                ))}
            </tr></thead>
              <tbody className="divide-y divide-[#F6F5F2]">
                {filtered.map((m, idx) => {
                  const matBatches = batches.filter((b) => b.materialId === m.id)
                  return (
                    <tr key={m.id} className={`${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                      <td className="px-4 py-2 text-[12px] font-mono text-[#5E5E5E]">{m.id}</td>
                      <td className="px-4 py-2 text-[13px] font-medium text-[#2B2B2B]">{m.name}{matBatches.length > 0 && <span className="block text-[10px] text-[#9E9E9E]">{matBatches.length} партий</span>}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5E5E5E]">{m.category}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5E5E5E]">{m.supplier || '—'}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5E5E5E] text-center">{m.unit}</td>
                      <td className="px-4 py-2 text-[13px] text-[#2B2B2B] text-right font-mono">{m.warehouseStock.toLocaleString()}</td>
                      <td className="px-4 py-2 text-[13px] text-[#2B2B2B] text-right font-mono">{m.workshopStock.toLocaleString()}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5E5E5E] text-right font-mono">{m.minStock !== null ? m.minStock.toLocaleString() : '—'}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5E5E5E] text-right font-mono">{m.costPerUnit !== null ? `${m.costPerUnit.toLocaleString()} ₽` : '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                          (m.status as string) === 'ok' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' :
                          (m.status as string) === 'low' ? 'bg-[#F0A830]/15 text-[#F0A830]' :
                          (m.status as string) === 'critical' ? 'bg-[#C0563F]/15 text-[#C0563F]' :
                          'bg-[#9E9E9E]/15 text-[#9E9E9E]'
                        }`}>{
                          (m.status as string) === 'ok' ? 'Норма' :
                          (m.status as string) === 'low' ? 'Низкий' :
                          (m.status as string) === 'critical' ? 'Критично' :
                          'Не настроен'
                        }</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#D4CFC8] flex items-center justify-between">
            <span className="text-[11px] text-[#9E9E9E]">{filtered.length} позиций | {batches.length} партий</span>
            <span className="text-[11px] text-[#9E9E9E]">Стоимостная оценка появится после добавления цен в API</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#D4CFC8]">
          <div className="overflow-x-auto">
            <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Партия</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Сырьё</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Поставщик</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Приход</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Остаток</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Ед.</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Цена</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата прихода</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Срок хран.</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th>
            </tr></thead>
              <tbody className="divide-y divide-[#F6F5F2]">
                {filteredBatches.map((b, idx) => (
                  <tr key={b.id} className={`h-12 ${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                    <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{b.id}</td>
                    <td className="px-4 text-[13px] font-medium text-[#2B2B2B]">{b.materialName}</td>
                    <td className="px-4 text-[12px] text-[#5E5E5E]">{b.supplier}</td>
                    <td className="px-4 text-[13px] text-right font-mono">{b.quantity.toLocaleString()}</td>
                    <td className="px-4 text-[13px] text-right font-mono">{b.remaining.toLocaleString()}</td>
                    <td className="px-4 text-[12px] text-center">{b.unit}</td>
                    <td className="px-4 text-[12px] text-right font-mono">{b.pricePerUnit.toLocaleString()} ₽</td>
                    <td className="px-4 text-[12px]">{b.arrivalDate}</td>
                    <td className="px-4 text-[12px] text-[#5E5E5E]">{b.expiryDate || '—'}</td>
                    <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${b.status === 'active' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : b.status === 'depleted' ? 'bg-[#9E9E9E]/15 text-[#9E9E9E]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{b.status === 'active' ? 'Активна' : b.status === 'depleted' ? 'Закончилась' : 'Просрочена'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
