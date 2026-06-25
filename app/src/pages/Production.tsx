import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapProductionOrder } from '../api/mappers/documents.mapper'
import { mapFinishedProducts } from '../api/mappers/items.mapper'
import { productionOrdersService } from '../api/services/productionOrders.service'
import { generateIdempotencyKey } from '../api/idempotency'
import { handleApiError } from '../api/errors'
import type { Item, StockBalanceRow, ProductionOrderDetail, StockLocation } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

export default function Production() {
  const { data: prodOrdersRes, loading: loadingProd, error: errorProd, refetch: refetchProd } = useApiQuery<{ data: ProductionOrderDetail[] }>('/api/production-orders', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 100 } })
  const { data: locationsRes, loading: loadingLocations } = useApiQuery<{ data: StockLocation[] }>('/api/locations')
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  // Creation form state
  const [productId, setProductId] = useState('')
  const [workshopLocationId, setWorkshopLocationId] = useState('')
  const [plannedQty, setPlannedQty] = useState('')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().substring(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Start / Cancel action states
  const [pendingAction, setPendingAction] = useState<{
    type: 'start' | 'cancel';
    orderId: string;
    orderNumber: string;
    key: string;
  } | null>(null)

  // Completion modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completeOrder, setCompleteOrder] = useState<ProductionOrderDetail | null>(null)
  const [actualQty, setActualQty] = useState('')
  const [outputBatch, setOutputBatch] = useState('')
  const [outputLocId, setOutputLocId] = useState('')
  const [useBom, setUseBom] = useState(true)
  const [completeIdempotencyKey, setCompleteIdempotencyKey] = useState<string | null>(null)
  const [manualLines, setManualLines] = useState<{
    materialId: string;
    materialName: string;
    quantity: string;
    unitSymbol: string;
  }[]>([])

  const { data: orderDetailRes, loading: loadingDetail, refetch: refetchDetail } = useApiQuery<ProductionOrderDetail>(
    detailId ? `/api/production-orders/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingProd || loadingItems || loadingLocations
  const error = errorProd

  const refetch = () => {
    refetchProd()
    if (detailId) refetchDetail()
  }

  // Filter finished items
  const finishedOnly = (itemsRes?.data || []).filter(
    (i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'
  )
  const finishedProducts = mapFinishedProducts(finishedOnly, balancesRes?.data || [])

  // Filter stock locations
  const workshops = (locationsRes?.data || []).filter((l) => l.isActive && (l.locationType || l.type) === 'WORKSHOP')
  const warehouses = (locationsRes?.data || []).filter((l) => l.isActive && (l.locationType || l.type) === 'WAREHOUSE')

  const productionOrders = (prodOrdersRes?.data || []).map(mapProductionOrder)
  const detailOrder = orderDetailRes ? mapProductionOrder(orderDetailRes) : null

  const hSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !plannedQty || !workshopLocationId || !scheduledDate) {
      alert('Заполните все обязательные поля формы')
      return
    }

    const selectedItem = (itemsRes?.data || []).find((it) => it.id === productId)
    if (!selectedItem) return

    try {
      setIsSubmitting(true)
      await productionOrdersService.create({
        targetItemId: productId,
        plannedQuantity: Number(plannedQty),
        targetUnitId: selectedItem.unit.id,
        workshopLocationId,
        scheduledDate: new Date(scheduledDate).toISOString(),
        bomId: null, // Resolves active BOM automatically on backend
      })

      setShowForm(false)
      setProductId('')
      setPlannedQty('')
      setWorkshopLocationId('')
      setScheduledDate(new Date().toISOString().substring(0, 10))
      refetchProd()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActionClick = (type: 'start' | 'cancel', orderId: string, orderNumber: string) => {
    setPendingAction({
      type,
      orderId,
      orderNumber,
      key: generateIdempotencyKey(),
    })
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    try {
      setIsSubmitting(true)
      const { type, orderId, key } = pendingAction
      if (type === 'start') {
        await productionOrdersService.start(orderId, key)
      } else {
        await productionOrdersService.cancel(orderId, key)
      }
      setPendingAction(null)
      refetch()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCompleteModal = (order: ProductionOrderDetail) => {
    setCompleteOrder(order)
    setActualQty(order.plannedQuantity.toString())
    setOutputBatch(`BATCH-PO-${order.orderNumber}`)
    setOutputLocId('')
    setUseBom(!!order.bomId)
    setCompleteIdempotencyKey(generateIdempotencyKey())
    setManualLines(
      (order.plannedLines || []).map((line) => ({
        materialId: line.itemId,
        materialName: line.itemName || 'Неизвестно',
        quantity: line.plannedQuantity.toString(),
        unitSymbol: line.unitSymbol || 'кг',
      }))
    )
    setCompleteModalOpen(true)
  }

  const closeCompleteModal = () => {
    setCompleteModalOpen(false)
    setCompleteOrder(null)
    setCompleteIdempotencyKey(null)
  }

  const handleCompleteOrder = async () => {
    if (!completeOrder || !actualQty || !outputBatch || !outputLocId) {
      alert('Заполните обязательные поля для завершения производства')
      return
    }
    if (!useBom && manualLines.some((line) => !line.materialId || Number(line.quantity) <= 0)) {
      alert('Проверьте строки фактического расхода сырья')
      return
    }
    if (!completeIdempotencyKey) {
      alert('Не удалось подготовить ключ безопасного повтора. Закройте окно и повторите действие.')
      return
    }

    try {
      setIsSubmitting(true)

      const consumptionLines = useBom
        ? undefined
        : manualLines.map((line) => {
            const itemObj = (itemsRes?.data || []).find((it) => it.id === line.materialId)
            return {
              itemId: line.materialId,
              quantity: Number(line.quantity),
              unitId: itemObj?.unit.id || '',
              batchId: null, // Backend FIFO resolution
            }
          })

      await productionOrdersService.complete(
        completeOrder.id,
        {
          actualQuantity: Number(actualQty),
          outputBatchNumber: outputBatch,
          productionLocationId: outputLocId,
          consumptionLines,
        },
        completeIdempotencyKey
      )

      closeCompleteModal()
      refetch()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Продукт</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите...</option>
                {finishedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Плановое количество</label>
              <input type="number" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" min="1" step="1" />
            </div>
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Цех производства</label>
              <select value={workshopLocationId} onChange={(e) => setWorkshopLocationId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите...</option>
                {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Дата планирования</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" />
            </div>
          </div>
          {productId && plannedQty && (
            <div className="mb-4 p-4 bg-[#F6F5F2] border border-[#D4CFC8] rounded text-[12px] text-[#5E5E5E]">
              Если для выбранного изделия есть активный BOM, сервер привяжет его к заказу и рассчитает плановый расход после сохранения.
            </div>
          )}
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" disabled={isSubmitting} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">{isSubmitting ? 'Сохранение...' : 'Создать'}</button></div>
        </form>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#D4CFC8] p-6 max-w-sm w-full mx-4 rounded">
            <h4 className="text-[14px] font-semibold mb-2">Подтвердите операцию</h4>
            <p className="text-[12px] text-[#5E5E5E] mb-4">
              {pendingAction.type === 'start'
                ? `Запустить заказ производства №${pendingAction.orderNumber} в работу? Это действие переведет статус в "В работе".`
                : `Отменить заказ производства №${pendingAction.orderNumber}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPendingAction(null)} className="h-9 px-4 text-[12px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]" disabled={isSubmitting}>
                Назад
              </button>
              <button onClick={handleConfirmAction} className={`h-9 px-4 text-[12px] font-medium text-white rounded ${pendingAction.type === 'cancel' ? 'bg-[#C0563F] hover:bg-[#A84835]' : 'bg-[#2A5C8D] hover:bg-[#1A4C7D]'}`} disabled={isSubmitting}>
                {isSubmitting ? 'Выполнение...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completeModalOpen && completeOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#D4CFC8] p-6 max-w-lg w-full mx-4 rounded max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-semibold">Выпуск продукции: {completeOrder.targetItem?.name || 'Неизвестно'}</h4>
              <button onClick={closeCompleteModal} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] text-[#5E5E5E] block mb-1">Фактически выпущено, ед.</label>
                <input type="number" value={actualQty} onChange={(e) => setActualQty(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" min="1" />
              </div>
              <div>
                <label className="text-[11px] text-[#5E5E5E] block mb-1">Номер выпускаемой партии</label>
                <input type="text" value={outputBatch} onChange={(e) => setOutputBatch(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" placeholder="Напр. BATCH-001" />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-[#5E5E5E] block mb-1">Склад поступления продукции</label>
              <select value={outputLocId} onChange={(e) => setOutputLocId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите склад...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#2B2B2B] cursor-pointer">
                <input type="checkbox" checked={useBom} disabled={!completeOrder.bomId} onChange={(e) => setUseBom(e.target.checked)} className="rounded text-[#5A8A6E] focus:ring-[#5A8A6E] h-4 w-4" />
                Списать сырье по рецепту (BOM) {!completeOrder.bomId && <span className="text-[10px] text-[#C0563F]">(нет привязанного рецепта)</span>}
              </label>
            </div>

            {!useBom && manualLines.length > 0 && (
              <div className="mb-4">
                <h5 className="text-[12px] font-semibold mb-2">Фактический расход сырья (Редактирование списания)</h5>
                <div className="border border-[#D4CFC8] rounded overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#EFEBE6] text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Сырье</th>
                        <th className="px-3 py-2 text-right">Количество</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEBE6]">
                      {manualLines.map((line, index) => (
                        <tr key={line.materialId} className="bg-white">
                          <td className="px-3 py-2">{line.materialName}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <input type="number" value={line.quantity} onChange={(e) => {
                                const newLines = [...manualLines]
                                newLines[index].quantity = e.target.value
                                setManualLines(newLines)
                              }} className="w-20 h-7 px-2 text-right text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" min="0" step="0.01" />
                              <span className="text-[#5E5E5E]">{line.unitSymbol}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-[#EFEBE6]">
              <button onClick={closeCompleteModal} className="h-9 px-4 text-[12px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]" disabled={isSubmitting}>
                Отмена
              </button>
              <button onClick={handleCompleteOrder} className="h-9 px-5 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E] disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? 'Выпуск...' : 'Подтвердить выпуск'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail card */}
      {detailOrder && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">Заказ: {detailOrder.id}</span>
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
                <div><span className="text-[#9E9E9E]">План выпуск:</span> <span className="font-medium">{detailOrder.plannedQuantity} ед.</span></div>
                <div><span className="text-[#9E9E9E]">Факт выпуск:</span> <span className="font-medium">{detailOrder.actualQuantity || '—'} ед.</span></div>
                <div><span className="text-[#9E9E9E]">Цех производства:</span> <span className="font-medium">{orderDetailRes?.workshopLocation.name}</span></div>
                <div><span className="text-[#9E9E9E]">Мастер:</span> <span className="font-medium">{detailOrder.responsible}</span></div>
              </div>
              {detailOrder.plannedMaterials && detailOrder.plannedMaterials.length > 0 && (
                <div className="mb-4"><h4 className="text-[12px] font-semibold mb-2">Потребность сырья по плану</h4>
                  <table className="w-full border border-[#D4CFC8]"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-right">Кол-во</th></tr></thead>
                    <tbody className="divide-y divide-[#EFEBE6]">{detailOrder.plannedMaterials.map((m, i) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{m.materialName}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{m.quantity} {m.unit}</td></tr>))}</tbody>
                  </table></div>
              )}
              {detailOrder.actualMaterialsUsed && detailOrder.actualMaterialsUsed.length > 0 && (
                <div className="mb-4"><h4 className="text-[12px] font-semibold mb-2">Фактическое списание сырья</h4>
                  <table className="w-full border border-[#D4CFC8]"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center">Партия</th><th className="px-3 py-2 text-[11px] font-semibold text-right">Кол-во</th></tr></thead>
                    <tbody className="divide-y divide-[#EFEBE6]">{detailOrder.actualMaterialsUsed.map((m, i) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{m.materialName}</td><td className="px-3 py-2 text-[11px] font-mono text-center text-[#5E5E5E]">{m.batchId || '—'}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{m.quantity} {m.unit}</td></tr>))}</tbody>
                  </table></div>
              )}
              <div className="flex gap-2">
                {detailOrder.status === 'planned' && <button onClick={() => handleActionClick('start', detailOrder.id, detailOrder.id.substring(0, 8))} className="h-8 px-4 text-[12px] font-medium text-white bg-[#2A5C8D] rounded hover:bg-[#1A4C7D]">В работу</button>}
                {detailOrder.status === 'in_progress' && <button onClick={() => openCompleteModal(orderDetailRes!)} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">Завершить и выпустить</button>}
                {(detailOrder.status === 'planned' || detailOrder.status === 'in_progress') && <button onClick={() => handleActionClick('cancel', detailOrder.id, detailOrder.id.substring(0, 8))} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Отменить</button>}
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
                  {o.status === 'planned' && <button onClick={(e) => { e.stopPropagation(); handleActionClick('start', o.id, o.id.substring(0, 8)) }} className="text-[11px] text-[#2A5C8D] font-medium">В работу</button>}
                  {o.status === 'in_progress' && <button onClick={(e) => { e.stopPropagation(); const fullDoc = (prodOrdersRes?.data || []).find((po) => po.id === o.id); if (fullDoc) openCompleteModal(fullDoc) }} className="text-[11px] text-[#5A8A6E] font-medium">Завершить</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
