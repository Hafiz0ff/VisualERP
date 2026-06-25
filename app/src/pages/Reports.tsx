import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapRawMaterials, mapFinishedProducts } from '../api/mappers/items.mapper'
import { mapProductionOrder } from '../api/mappers/documents.mapper'
import type { Item as BackendItem, StockBalanceRow, ProductionOrderDetail } from '../api/types'
import { AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Reports() {
  const { data: itemsRes, loading: loadingItems, error: errorItems, refetch: refetchItems } = useApiQuery<{ data: BackendItem[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes, loading: loadingBalances, error: errorBalances, refetch: refetchBalances } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: prodOrdersRes, loading: loadingProd, error: errorProd, refetch: refetchProd } = useApiQuery<{ data: ProductionOrderDetail[] }>('/api/production-orders', { params: { pageSize: 1000 } })

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
  const finishedProducts = mapFinishedProducts(
    (itemsRes?.data || []).filter((i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'),
    balancesRes?.data || []
  )
  const productionOrders = (prodOrdersRes?.data || []).map(mapProductionOrder)

  const hasProductPrices = finishedProducts.some((p) => p.price !== null)
  const hasRawCosts = rawMaterials.some((m) => m.costPerUnit !== null)
  const totalStockValue = finishedProducts.reduce((s, p) => s + p.stock * (p.price ?? 0), 0)
  const totalRawValue = rawMaterials.reduce((s, m) => s + m.warehouseStock * (m.costPerUnit ?? 0), 0)
  const pricedProducts = finishedProducts.filter((p) => p.price !== null)
  const avgBagPrice = pricedProducts.length > 0
    ? pricedProducts.reduce((s, p) => s + (p.price ?? 0), 0) / pricedProducts.length
    : null

  const completedOrders = productionOrders.filter((o) => o.status === 'completed')

  // Calculate dynamic production by product
  const productQuantities: Record<string, number> = {}
  completedOrders.forEach((o) => {
    productQuantities[o.productName] = (productQuantities[o.productName] || 0) + (o.actualQuantity || 0)
  })
  let productionByProduct = Object.entries(productQuantities).map(([name, qty]) => ({ name, qty }))
  if (productionByProduct.length === 0) {
    productionByProduct = [
      { name: 'Клей плиточный', qty: 0 },
      { name: 'Штукатурка серая', qty: 0 },
    ]
  }

  // Calculate monthly production
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  const monthlyData: Record<string, number> = {}
  completedOrders.forEach((o) => {
    if (o.date) {
      const parts = o.date.split('.')
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[1], 10) - 1
        if (monthIdx >= 0 && monthIdx < 12) {
          const mName = monthNames[monthIdx]
          monthlyData[mName] = (monthlyData[mName] || 0) + (o.actualQuantity || 0)
        }
      }
    }
  })

  const now = new Date()
  const monthlyProduction = monthNames
    .map((m) => ({
      month: m,
      qty: monthlyData[m] || 0,
    }))
    .filter((item, idx) => idx <= now.getMonth() || item.qty > 0)

  // Calculate raw material usage by category or stock proportions
  const categoryBalances: Record<string, number> = {}
  rawMaterials.forEach((m) => {
    categoryBalances[m.category] = (categoryBalances[m.category] || 0) + m.warehouseStock
  })
  const totalCatStock = Object.values(categoryBalances).reduce((a, b) => a + b, 0) || 1

  const colors = ['#C0563F', '#2A5C8D', '#5A8A6E', '#F0A830', '#9E9E9E', '#D4CFC8']
  const rawMaterialUsage = Object.entries(categoryBalances).map(([name, val], i) => ({
    name,
    value: Math.round((val / totalCatStock) * 100),
    color: colors[i % colors.length],
  })).filter((c) => c.value > 0)

  const displayRawUsage = rawMaterialUsage.length > 0 ? rawMaterialUsage : [
    { name: 'Вяжущие', value: 100, color: '#C0563F' }
  ]

  const categories = Array.from(new Set(rawMaterials.map((m) => m.category)))

  if (loading) {
    return (
      <Layout title="Отчеты">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#D4CFC8] p-4 animate-pulse h-16" />
          ))}
        </div>
        <div className="bg-white border border-[#D4CFC8] rounded p-8 animate-pulse flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#EFEBE6] rounded w-full" />
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Отчеты">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить отчеты</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Отчеты">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Сырьё на складе</div><div className="text-[22px] font-bold">{hasRawCosts ? `${totalRawValue.toLocaleString()} ₽` : '—'}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Готовая продукция</div><div className="text-[22px] font-bold">{hasProductPrices ? `${totalStockValue.toLocaleString()} ₽` : '—'}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Выполнено заказов</div><div className="text-[22px] font-bold">{completedOrders.length}</div></div>
        <div className="bg-white border border-[#D4CFC8] p-4"><div className="text-[12px] text-[#5E5E5E] mb-1">Средняя цена мешка</div><div className="text-[22px] font-bold">{avgBagPrice === null ? '—' : `${Math.round(avgBagPrice)} ₽`}</div></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#D4CFC8] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Производство по месяцам</h3>
          <ResponsiveContainer width="100%" height={260}>
            {monthlyProduction.every(d => d.qty === 0) ? (
              <div className="h-full flex items-center justify-center text-[12px] text-[#9E9E9E]">Нет данных о выпуске</div>
            ) : (
              <BarChart data={monthlyProduction} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFEBE6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={{ stroke: '#D4CFC8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={{ stroke: '#D4CFC8' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D4CFC8', borderRadius: '4px', fontSize: '12px' }} formatter={(v: number) => [`${v.toLocaleString()} меш.`, '']} />
                <Bar dataKey="qty" fill="#C0563F" radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-[#D4CFC8] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Расход сырья по категориям (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={displayRawUsage} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {displayRawUsage.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D4CFC8', borderRadius: '4px', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-[#D4CFC8] p-5 mb-6">
        <h3 className="text-[14px] font-semibold mb-4">Производство по продуктам</h3>
        <ResponsiveContainer width="100%" height={300}>
          {productionByProduct.every(d => d.qty === 0) ? (
            <div className="h-full flex items-center justify-center text-[12px] text-[#9E9E9E]">Нет данных по продуктам</div>
          ) : (
            <BarChart data={productionByProduct} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFEBE6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={{ stroke: '#D4CFC8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5E5E5E' }} axisLine={{ stroke: '#D4CFC8' }} width={80} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D4CFC8', borderRadius: '4px', fontSize: '12px' }} formatter={(v: number) => [`${v.toLocaleString()} меш.`, '']} />
              <Bar dataKey="qty" fill="#2A5C8D" radius={[0, 2, 2, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-[#D4CFC8]">
        <div className="px-5 py-3 border-b border-[#D4CFC8]"><h3 className="text-[14px] font-semibold">Стоимостная оценка остатков</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Категория</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Позиций</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Остаток</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Себестоимость ₽</th>
            </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">
              {categories.map((cat, idx) => {
                const mats = rawMaterials.filter((m) => m.category === cat)
                return (<tr key={cat} className={`h-10 ${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                  <td className="px-4 text-[13px] font-medium">{cat}</td>
                  <td className="px-4 text-[13px] text-right font-mono">{mats.length}</td>
                  <td className="px-4 text-[13px] text-right font-mono">{mats.reduce((s, m) => s + m.warehouseStock, 0).toLocaleString()}</td>
                  <td className="px-4 text-[13px] text-right font-mono">{mats.some((m) => m.costPerUnit !== null) ? `${mats.reduce((s, m) => s + m.warehouseStock * (m.costPerUnit ?? 0), 0).toLocaleString()} ₽` : '—'}</td>
                </tr>)
              })}
              <tr className="h-10 bg-[#EFEBE6] font-semibold"><td className="px-4">Итого сырьё</td><td className="px-4 text-right font-mono">{rawMaterials.length}</td><td className="px-4 text-right font-mono">—</td><td className="px-4 text-right font-mono">{hasRawCosts ? `${totalRawValue.toLocaleString()} ₽` : '—'}</td></tr>
              <tr className="h-10 bg-[#EFEBE6] font-semibold"><td className="px-4">Итого продукция</td><td className="px-4 text-right font-mono">{finishedProducts.length}</td><td className="px-4 text-right font-mono">{finishedProducts.reduce((s, p) => s + p.stock, 0).toLocaleString()} меш.</td><td className="px-4 text-right font-mono">{hasProductPrices ? `${totalStockValue.toLocaleString()} ₽` : '—'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
