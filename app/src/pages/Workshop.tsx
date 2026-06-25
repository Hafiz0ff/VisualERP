import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapRawMaterials } from '../api/mappers/items.mapper'
import { mapProductionOrder } from '../api/mappers/documents.mapper'
import type { Item as BackendItem, StockBalanceRow, ProductionOrderDetail } from '../api/types'
import { Factory, AlertTriangle, Package, FlaskConical } from 'lucide-react'

export default function Workshop() {
  const { data: itemsRes, loading: loadingItems, error: errorItems, refetch: refetchItems } = useApiQuery<{ data: BackendItem[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes, loading: loadingBalances, error: errorBalances, refetch: refetchBalances } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: prodOrdersRes, loading: loadingProd, error: errorProd, refetch: refetchProd } = useApiQuery<{ data: ProductionOrderDetail[] }>('/api/production-orders', { params: { pageSize: 100 } })

  const [view, setView] = useState<'materials' | 'orders'>('materials')

  const loading = loadingItems || loadingBalances || loadingProd
  const error = errorItems || errorBalances || errorProd
  const refetch = () => {
    refetchItems()
    refetchBalances()
    refetchProd()
  }

  const rawMaterials = mapRawMaterials(
    (itemsRes?.data || []).filter((i) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(i.itemType)),
    balancesRes?.data || []
  )
  const productionOrders = (prodOrdersRes?.data || []).map(mapProductionOrder)

  const workshopMaterials = rawMaterials.filter((m) => m.workshopStock > 0)
  const inProgress = productionOrders.filter((o) => o.status === 'in_progress')
  const planned = productionOrders.filter((o) => o.status === 'planned')

  const now = new Date()
  const todayStr = now.toLocaleDateString()
  const completedToday = productionOrders.filter(
    (o) => o.status === 'completed' && o.date === todayStr
  )

  const lowInWorkshop = workshopMaterials.filter((m) => m.workshopStock < (m.minStock ?? 0) * 0.3)

  if (loading) {
    return (
      <Layout title="Цех">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#D4CFC8] p-4 animate-pulse h-16" />
          ))}
        </div>
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
      <Layout title="Цех">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить данные цеха</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Цех">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#2A5C8D]/10 rounded"><Factory size={16} className="text-[#2A5C8D]" /></div><span className="text-[12px] text-[#5E5E5E]">В работе</span></div><div className="text-[24px] font-bold">{inProgress.length}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#F0A830]/10 rounded"><Package size={16} className="text-[#F0A830]" /></div><span className="text-[12px] text-[#5E5E5E]">Позиций сырья</span></div><div className="text-[24px] font-bold">{workshopMaterials.length}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#5A8A6E]/10 rounded"><FlaskConical size={16} className="text-[#5A8A6E]" /></div><span className="text-[12px] text-[#5E5E5E]">Выполнено</span></div><div className="text-[24px] font-bold">{completedToday.length}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#C0563F]/10 rounded"><AlertTriangle size={16} className="text-[#C0563F]" /></div><span className="text-[12px] text-[#5E5E5E]">Внимание</span></div><div className="text-[24px] font-bold text-[#C0563F]">{lowInWorkshop.length}</div></div>
      </div>

      {/* Toggle */}
      <div className="flex border border-[#D4CFC8] rounded overflow-hidden mb-4 w-fit">
        <button onClick={() => setView('materials')} className={`h-8 px-3 text-[12px] font-medium ${view === 'materials' ? 'bg-[#C0563F] text-white' : 'bg-white text-[#5E5E5E] hover:bg-[#F6F5F2]'}`}>Сырьё в цехе</button>
        <button onClick={() => setView('orders')} className={`h-8 px-3 text-[12px] font-medium ${view === 'orders' ? 'bg-[#C0563F] text-white' : 'bg-white text-[#5E5E5E] hover:bg-[#F6F5F2]'}`}>Производственные заказы</button>
      </div>

      {view === 'materials' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#D4CFC8]">
            <div className="px-5 py-3 border-b border-[#D4CFC8]"><h3 className="text-[14px] font-semibold">Остатки сырья в цехе</h3></div>
            <div className="overflow-x-auto">
              {workshopMaterials.length === 0 ? (
                <div className="text-center p-8 text-[12px] text-[#5E5E5E]">Сырьё в цехе отсутствует.</div>
              ) : (
                <table className="w-full"><thead className="bg-[#EFEBE6]"><tr><th className="px-4 py-2.5 text-[11px] font-semibold text-left">Сырьё</th><th className="px-4 py-2.5 text-[11px] font-semibold text-center">Ед.</th><th className="px-4 py-2.5 text-[11px] font-semibold text-right">Кол-во</th><th className="px-4 py-2.5 text-[11px] font-semibold text-right">Мин.</th><th className="px-4 py-2.5 text-[11px] font-semibold text-center">Статус</th></tr></thead>
                  <tbody className="divide-y divide-[#F6F5F2]">{workshopMaterials.sort((a, b) => b.workshopStock - a.workshopStock).map((m) => {
                    const mb = m.batchIds || []
                    const isCritical = m.minStock !== null && m.workshopStock < m.minStock * 0.3;
                    const isLow = m.minStock !== null && m.workshopStock < m.minStock * 0.6;
                    return (
                      <tr key={m.id} className="h-10 hover:bg-[#EFEBE6]">
                        <td className="px-4 text-[12px] font-medium">
                          {m.name}
                          {mb.length > 0 && <span className="block text-[10px] text-[#9E9E9E]">{mb.length} партий</span>}
                        </td>
                        <td className="px-4 text-[11px] text-center text-[#5E5E5E]">{m.unit}</td>
                        <td className="px-4 text-[12px] text-right font-mono">{m.workshopStock.toLocaleString()}</td>
                        <td className="px-4 text-[11px] text-right font-mono text-[#5E5E5E]">
                          {m.minStock !== null ? m.minStock.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                            isCritical ? 'bg-[#C0563F]/15 text-[#C0563F]' :
                            isLow ? 'bg-[#F0A830]/15 text-[#F0A830]' :
                            'bg-[#5A8A6E]/15 text-[#5A8A6E]'
                          }`}>
                            {isCritical ? 'Критично' : isLow ? 'Низкий' : 'Норма'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}</tbody></table>
              )}
            </div>
          </div>
          <div className="bg-white border border-[#D4CFC8]">
            <div className="px-5 py-3 border-b border-[#D4CFC8] flex justify-between"><h3 className="text-[14px] font-semibold">В работе</h3><span className="text-[11px] text-[#2A5C8D]">{inProgress.length}</span></div>
            <div className="divide-y divide-[#EFEBE6]">
              {inProgress.length === 0 ? (
                <div className="text-center p-8 text-[12px] text-[#5E5E5E]">Нет активных заказов в работе.</div>
              ) : (
                inProgress.map((o) => (
                  <div key={o.id} className="px-5 py-3"><div className="flex justify-between"><span className="text-[12px] font-mono text-[#5E5E5E]">{o.id}</span><span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-[#2A5C8D]/15 text-[#2A5C8D]">В работе</span></div><div className="text-[13px] font-medium">{o.productName}</div><div className="text-[11px] text-[#9E9E9E]">{o.plannedQuantity} мешков | {o.responsible}{o.startDate && ` | с ${o.startDate}`}</div></div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#D4CFC8]">
            <div className="px-5 py-3 border-b border-[#D4CFC8] flex justify-between"><h3 className="text-[14px] font-semibold">План на сегодня</h3><span className="text-[11px] text-[#9E9E9E]">{planned.length}</span></div>
            <div className="divide-y divide-[#EFEBE6]">
              {planned.length === 0 ? (
                <div className="text-center p-8 text-[12px] text-[#5E5E5E]">Нет запланированных заказов.</div>
              ) : (
                planned.map((o) => (
                  <div key={o.id} className="px-5 py-3"><div className="flex justify-between"><span className="text-[12px] font-mono text-[#5E5E5E]">{o.id}</span><span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-[#9E9E9E]/15 text-[#9E9E9E]">План</span></div><div className="text-[13px] font-medium">{o.productName}</div><div className="text-[11px] text-[#9E9E9E]">{o.plannedQuantity} мешков | {o.responsible}</div></div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white border border-[#D4CFC8]">
            <div className="px-5 py-3 border-b border-[#D4CFC8] flex justify-between"><h3 className="text-[14px] font-semibold">Выполнено сегодня</h3><span className="text-[11px] text-[#5A8A6E]">{completedToday.length}</span></div>
            <div className="divide-y divide-[#EFEBE6]">
              {completedToday.length === 0 ? (
                <div className="text-center p-8 text-[12px] text-[#5E5E5E]">Сегодня еще нет выполненных заказов.</div>
              ) : (
                completedToday.map((o) => (
                  <div key={o.id} className="px-5 py-3"><div className="flex justify-between"><span className="text-[12px] font-mono text-[#5E5E5E]">{o.id}</span><span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-[#5A8A6E]/15 text-[#5A8A6E]">Выполнено</span></div><div className="text-[13px] font-medium">{o.productName}</div><div className="text-[11px] text-[#9E9E9E]">{o.actualQuantity || o.plannedQuantity} мешков | {o.responsible}{o.endDate && ` | ${o.endDate}`}</div></div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
