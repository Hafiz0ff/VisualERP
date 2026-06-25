import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapFinishedProducts } from '../api/mappers/items.mapper'
import type { Item, StockBalanceRow, ProductionOrderDetail } from '../api/types'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency, formatNumber, toFiniteNumber } from '@/lib/number-format'

export default function Products() {
  const { data: itemsRes, loading: loadingItems, error: errorItems, refetch: refetchItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 100 } })
  const { data: balancesRes, loading: loadingBalances, error: errorBalances, refetch: refetchBalances } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: prodRes, loading: loadingProd, error: errorProd, refetch: refetchProd } = useApiQuery<{ data: ProductionOrderDetail[] }>('/api/production-orders', { params: { pageSize: 100 } })

  const loading = loadingItems || loadingBalances || loadingProd
  const error = errorItems || errorBalances || errorProd
  const refetch = () => {
    refetchItems()
    refetchBalances()
    refetchProd()
  }

  const finishedOnly = (itemsRes?.data || []).filter(
    (i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'
  )

  const mappedBase = mapFinishedProducts(finishedOnly, balancesRes?.data || [])

  const completedOrders = (prodRes?.data || []).filter((o) => o.status === 'COMPLETED')
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const finishedProducts = mappedBase.map((p) => {
    const pOrders = completedOrders.filter((o) => o.targetItem.id === p.id)

    const producedToday = pOrders
      .filter((o) => o.completedAt && new Date(o.completedAt) >= startOfDay)
      .reduce((sum, o) => sum + toFiniteNumber(o.actualQuantity), 0)

    const producedMonth = pOrders
      .filter((o) => o.completedAt && new Date(o.completedAt) >= startOfMonth)
      .reduce((sum, o) => sum + toFiniteNumber(o.actualQuantity), 0)

    return {
      ...p,
      producedToday,
      producedMonth,
    }
  })

  const hasProductPrices = finishedProducts.some((p) => p.price !== null)
  const ts = finishedProducts.reduce((s, p) => s + p.stock, 0)
  const tm = finishedProducts.reduce((s, p) => s + p.producedMonth, 0)
  const tv = finishedProducts.reduce((s, p) => s + p.stock * (p.price ?? 0), 0)

  if (loading) {
    return (
      <Layout title="Готовая продукция">
        <div className="grid grid-cols-4 gap-4 mb-6">
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
      <Layout title="Готовая продукция">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить данные готовой продукции</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Готовая продукция">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Позиций</div><div className="text-[24px] font-bold">{finishedProducts.length}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Остаток (меш.)</div><div className="text-[24px] font-bold">{formatNumber(ts)}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Выпущено за месяц</div><div className="text-[24px] font-bold">{formatNumber(tm)}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Стоимость остатков</div><div className="text-[24px] font-bold">{hasProductPrices ? formatCurrency(tv) : '—'}</div></div>
      </div>

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Продукт</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Упаковка</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Остаток</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Сегодня</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">За месяц</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Цена ₽</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Сумма ₽</th>
            </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">
              {finishedProducts.map((p, idx) => (
                <tr key={p.id} className={`h-12 ${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                  <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{p.id}</td>
                  <td className="px-4 text-[13px] font-medium">{p.name}</td>
                  <td className="px-4 text-[12px] text-[#5E5E5E]">{p.packaging}</td>
                  <td className="px-4 text-[13px] text-right font-mono">{formatNumber(p.stock)}</td>
                  <td className="px-4 text-[13px] text-[#5A8A6E] text-right font-mono font-medium">+{formatNumber(p.producedToday)}</td>
                  <td className="px-4 text-[12px] text-right font-mono">{formatNumber(p.producedMonth)}</td>
                  <td className="px-4 text-[12px] text-right font-mono">{p.price === null ? '—' : formatNumber(p.price)}</td>
                  <td className="px-4 text-[12px] text-right font-mono">{p.price === null ? '—' : formatNumber(p.stock * p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#D4CFC8] flex items-center justify-between">
          <span className="text-[11px] text-[#9E9E9E]">Итого: {finishedProducts.length} позиций</span>
          <span className="text-[12px] font-medium">Общая стоимость: {hasProductPrices ? formatCurrency(tv) : '—'}</span>
        </div>
      </div>
    </Layout>
  )
}
