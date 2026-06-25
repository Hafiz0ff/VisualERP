import { useState, useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapProductionOrder } from '../api/mappers/documents.mapper'
import { mapFinishedProducts } from '../api/mappers/items.mapper'
import type { Item, StockBalanceRow, ProductionOrderDetail } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

export default function Production() {
  const { data: prodOrdersRes, loading: loadingProd, error: errorProd, refetch: refetchProd } = useApiQuery<{ data: ProductionOrderDetail[] }>('/api/production-orders', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [productId, setProductId] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [plannedQty, setPlannedQty] = useState('')
  const [responsible, setResponsible] = useState('')

  const { data: orderDetailRes, loading: loadingDetail } = useApiQuery<ProductionOrderDetail>(
    detailId ? `/api/production-orders/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingProd || loadingItems
  const error = errorProd
  const refetch = () => {
    refetchProd()
  }

  // Placeholder recipes list - keep it mock/fallback
  const recipes: any[] = [
    { id: 'RC001', productId: 'FG-ADH-25', productName: 'Tile Adhesive 25kg', yieldPerBatch: 1, ingredients: [] }
  ]

  const finishedOnly = (itemsRes?.data || []).filter(
    (i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'
  )

  const finishedProducts = mapFinishedProducts(finishedOnly, balancesRes?.data || [])
  const productionOrders = (prodOrdersRes?.data || []).map(mapProductionOrder)
  const detailOrder = orderDetailRes ? mapProductionOrder(orderDetailRes) : null

  const recipe = useMemo(() => recipes.find((r) => r.id === recipeId), [recipeId])
  const calc = useMemo(() => {
    if (!recipe || !plannedQty) return []
    const q = Number(plannedQty); if (isNaN(q) || q <= 0) return []
    return (recipe.ingredients || []).map((ing: any) => ({ ...ing, total: +(ing.quantityPerUnit * q).toFixed(2) }))
  }, [recipe, plannedQty])

  const hProduct = (pid: string) => {
    setProductId(pid)
    const r = recipes.find((rc) => rc.productId === pid)
    setRecipeId(r?.id || '')
  }

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Запуск производства на бэкенде отключен для этой фазы (Read-Only).')
    setShowForm(false)
  }

  if (loading) {
    return (
      <Layout title="Производство">
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
      <Layout title="Производство">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить заказы производства</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  const sOrder = { planned: 0, in_progress: 1, completed: 2, cancelled: 3 }

  return (
    <Layout title="Производство">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{productionOrders.length}</strong> | В работе: <strong className="text-[#2A5C8D]">{productionOrders.filter((o) => o.status === 'in_progress').length}</strong> | Выполнено: <strong className="text-[#5A8A6E]">{productionOrders.filter((o) => o.status === 'completed').length}</strong></span>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Новый заказ</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Создание производственного заказа</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Продукт</label><select value={productId} onChange={(e) => hProduct(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{finishedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Плановое кол-во, меш.</label><input type="number" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" min="1" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Мастер</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
          </div>
          {calc.length > 0 && (
            <div className="mb-4 p-4 bg-[#F6F5F2] border border-[#D4CFC8] rounded">
              <h4 className="text-[12px] font-semibold mb-2">Расчёт потребности сырья ({plannedQty} меш.)</h4>
              <table className="w-full"><thead><tr className="border-b border-[#D4CFC8]"><th className="py-1.5 text-[11px] text-[#5E5E5E] text-left">Сырьё</th><th className="py-1.5 text-[11px] text-[#5E5E5E] text-right">На 1 меш.</th><th className="py-1.5 text-[11px] text-[#5E5E5E] text-right">План</th></tr></thead>
                <tbody>{calc.map((m: any) => <tr key={m.materialId} className="border-b border-[#EFEBE6]"><td className="py-1.5 text-[12px]">{m.materialName}</td><td className="py-1.5 text-[12px] text-[#5E5E5E] text-right font-mono">{m.quantityPerUnit} {m.unit}</td><td className="py-1.5 text-[12px] text-[#C0563F] text-right font-mono font-medium">{m.total} {m.unit}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" disabled={!productId || !plannedQty || !responsible} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">Создать</button></div>
        </form>
      )}

      {/* Detail card */}
      {detailOrder && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">{detailOrder.id}</span>
              <span className="text-[18px] font-semibold text-[#2B2B2B]">{detailOrder.productName}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${detailOrder.status === 'completed' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : detailOrder.status === 'in_progress' ? 'bg-[#2A5C8D]/15 text-[#2A5C8D]' : detailOrder.status === 'planned' ? 'bg-[#9E9E9E]/15 text-[#9E9E9E]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>
                {detailOrder.status === 'completed' ? 'Выполнено' : detailOrder.status === 'in_progress' ? 'В работе' : detailOrder.status === 'planned' ? 'План' : 'Отменён'}
              </span>
            </div>
            <button onClick={() => setDetailId(null)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>
          {loadingDetail ? (
            <div className="h-24 flex items-center justify-center text-[12px] text-[#9E9E9E]">Загрузка деталей заказа...</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-4 text-[12px]">
                <div><span className="text-[#9E9E9E]">План:</span> <span className="font-medium">{detailOrder.plannedQuantity} меш.</span></div>
                <div><span className="text-[#9E9E9E]">Факт:</span> <span className="font-medium">{detailOrder.actualQuantity || '—'} меш.</span></div>
                <div><span className="text-[#9E9E9E]">Мастер:</span> <span className="font-medium">{detailOrder.responsible}</span></div>
              </div>
              {detailOrder.plannedMaterials && detailOrder.plannedMaterials.length > 0 && (
                <div className="mb-4"><h4 className="text-[12px] font-semibold mb-2">Потребность сырья по плану</h4>
                  <table className="w-full border border-[#D4CFC8]"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-right">Кол-во</th></tr></thead>
                    <tbody className="divide-y divide-[#EFEBE6]">{detailOrder.plannedMaterials.map((m: any, i: number) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{m.materialName}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{m.quantity} {m.unit}</td></tr>))}</tbody>
                  </table></div>
              )}
              {detailOrder.actualMaterialsUsed && detailOrder.actualMaterialsUsed.length > 0 && (
                <div className="mb-4"><h4 className="text-[12px] font-semibold mb-2">Фактическое списание сырья</h4>
                  <table className="w-full border border-[#D4CFC8]"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center">Партия</th><th className="px-3 py-2 text-[11px] font-semibold text-right">Кол-во</th></tr></thead>
                    <tbody className="divide-y divide-[#EFEBE6]">{detailOrder.actualMaterialsUsed.map((m: any, i: number) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{m.materialName}</td><td className="px-3 py-2 text-[11px] font-mono text-center text-[#5E5E5E]">{m.batchId || '—'}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{m.quantity} {m.unit}</td></tr>))}</tbody>
                  </table></div>
              )}
              <div className="flex gap-2">
                {detailOrder.status === 'planned' && <button onClick={() => { alert('Запуск производства на бэкенде отключен для этой фазы (Read-Only).'); }} className="h-8 px-4 text-[12px] font-medium text-white bg-[#2A5C8D] rounded hover:bg-[#1A4C7D]">В работу</button>}
                {detailOrder.status === 'in_progress' && <button onClick={() => { alert('Завершение производства на бэкенде отключено для этой фазы (Read-Only).'); }} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">Завершить</button>}
                {(detailOrder.status === 'planned' || detailOrder.status === 'in_progress') && <button onClick={() => { alert('Отмена производства на бэкенде отключена для этой фазы (Read-Only).'); }} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Отменить</button>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Продукт</th><th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">План</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Факт</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Мастер</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]"></th>
          </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">{productionOrders.slice().sort((a, b) => sOrder[a.status as keyof typeof sOrder] - sOrder[b.status as keyof typeof sOrder] || b.id.localeCompare(a.id)).map((o) => (
              <tr key={o.id} className={`h-12 hover:bg-[#EFEBE6] cursor-pointer ${detailId === o.id ? 'bg-[#F6F5F2]' : ''}`} onClick={() => setDetailId(detailId === o.id ? null : o.id)}>
                <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{o.id}</td><td className="px-4 text-[12px]">{o.date}</td>
                <td className="px-4 text-[13px] font-medium">{o.productName}{o.startDate && <span className="block text-[10px] text-[#9E9E9E]">{o.startDate}{o.endDate ? ` — ${o.endDate}` : ''}</span>}</td>
                <td className="px-4 text-[13px] text-right font-mono">{o.plannedQuantity}</td>
                <td className="px-4 text-[13px] text-right font-mono">{o.actualQuantity || '—'}</td>
                <td className="px-4 text-[12px] text-[#5E5E5E]">{o.responsible}</td>
                <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${o.status === 'completed' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : o.status === 'in_progress' ? 'bg-[#2A5C8D]/15 text-[#2A5C8D]' : o.status === 'planned' ? 'bg-[#9E9E9E]/15 text-[#9E9E9E]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{o.status === 'completed' ? 'Выполнено' : o.status === 'in_progress' ? 'В работе' : o.status === 'planned' ? 'План' : 'Отменён'}</span></td>
                <td className="px-4 text-center"><div className="flex items-center justify-center gap-2">
                  {o.status === 'planned' && <button onClick={(e) => { e.stopPropagation(); alert('Запуск производства на бэкенде отключен для этой фазы (Read-Only).'); }} className="text-[11px] text-[#2A5C8D] font-medium">В работу</button>}
                  {o.status === 'in_progress' && <button onClick={(e) => { e.stopPropagation(); alert('Завершение производства на бэкенде отключено для этой фазы (Read-Only).'); }} className="text-[11px] text-[#5A8A6E] font-medium">Завершить</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
