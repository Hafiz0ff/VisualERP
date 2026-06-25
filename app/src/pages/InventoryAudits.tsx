import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapInventoryAudit } from '../api/mappers/documents.mapper'
import { inventoryAuditsService, type UpdateInventoryAuditLineInput } from '../api/services/inventoryAudits.service'
import { generateIdempotencyKey } from '../api/idempotency'
import { handleApiError } from '../api/errors'
import type { Item, StockBalanceRow, InventoryAuditDetail, StockLocation } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

interface LocalCountLine {
  itemId: string;
  itemName: string;
  unitId: string;
  unitSymbol: string;
  batchId: string | null;
  batchNumber: string | null;
  expectedQuantity: number;
  actualQuantity: number;
}

export default function InventoryAudits() {
  const { data: auditsRes, loading: loadingAudits, error: errorAudits, refetch: refetchAudits } = useApiQuery<{ data: InventoryAuditDetail[] }>('/api/inventory-audits', { params: { pageSize: 100 } })
  const { data: locationsRes, loading: loadingLocations } = useApiQuery<{ data: StockLocation[] }>('/api/locations')
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes, refetch: refetchBalances } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [counts, setCounts] = useState<LocalCountLine[]>([])

  const [pendingAction, setPendingAction] = useState<{
    type: 'count' | 'approve' | 'cancel';
    docId: string;
    docNumber?: string;
    key: string;
  } | null>(null)

  const { data: auditDetailRes, loading: loadingDetail, refetch: refetchDetail } = useApiQuery<InventoryAuditDetail>(
    detailId ? `/api/inventory-audits/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingAudits || loadingLocations || loadingItems
  const error = errorAudits
  const refetch = () => {
    refetchAudits()
    refetchBalances()
    if (detailId) refetchDetail()
  }

  const locations = locationsRes?.data || []
  const items = itemsRes?.data || []
  const stockBalances = balancesRes?.data || []
  const audits = (auditsRes?.data || []).map(mapInventoryAudit)
  const detailAudit = auditDetailRes ? mapInventoryAudit(auditDetailRes) : null

  // Prepare default count sheet for a location (all items matching active types)
  const handleLoadItemsForLocation = (locId: string) => {
    if (!locId) return
    const relevantItems = items.filter((it) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'FINISHED_PRODUCT', 'SEMI_FINISHED'].includes(it.itemType))
    const initialCounts = relevantItems.map((it) => {
      // Find expected balance
      const itemBals = stockBalances.filter((b) => b.itemId === it.id && b.locationId === locId)
      // Usually audits are batch-specific. If multiple batches, we map each batch or aggregate.
      // For simplicity, map each batch balance + a line for no-batch if empty
      if (itemBals.length > 0) {
        return itemBals.map((b) => ({
          itemId: it.id,
          itemName: it.name,
          unitId: it.unit.id,
          unitSymbol: it.unit.symbol,
          batchId: b.batchId,
          batchNumber: b.batchNumber,
          expectedQuantity: b.quantity,
          actualQuantity: b.quantity, // default counted equals expected
        }))
      } else {
        return [{
          itemId: it.id,
          itemName: it.name,
          unitId: it.unit.id,
          unitSymbol: it.unit.symbol,
          batchId: null,
          batchNumber: null,
          expectedQuantity: 0,
          actualQuantity: 0,
        }]
      }
    }).flat()

    setCounts(initialCounts)
  }

  const handleLocationChange = (locId: string) => {
    setLocationId(locId)
    handleLoadItemsForLocation(locId)
  }

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationId) return
    try {
      setIsSubmitting(true)
      // Filter count sheet lines that either have expected quantity or actual counted quantity
      const auditLines: UpdateInventoryAuditLineInput[] = counts
        .filter((c) => c.expectedQuantity > 0 || c.actualQuantity > 0)
        .map((c) => ({
          itemId: c.itemId,
          actualQuantity: c.actualQuantity,
          unitId: c.unitId,
          batchId: c.batchId,
        }))

      const newAudit = await inventoryAuditsService.create({
        locationId,
        auditDate: new Date().toISOString(),
        lines: auditLines,
      })

      setShowForm(false)
      setLocationId('')
      setCounts([])
      refetchAudits()
      setDetailId(newAudit.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load count lines from detail when it loads
  const handleStartCountForm = () => {
    if (!auditDetailRes) return
    const lines: LocalCountLine[] = auditDetailRes.lines.map((line) => ({
      itemId: line.itemId,
      itemName: line.itemName || line.item?.name || line.itemId,
      unitId: line.unitId,
      unitSymbol: line.unitSymbol || line.unit?.symbol || '',
      batchId: line.batchId || null,
      batchNumber: line.batchNumber || line.batch?.batchNumber || null,
      expectedQuantity: line.expectedQuantity,
      actualQuantity: line.actualQuantity,
    }))
    setCounts(lines)
  }

  const handleActualQtyChange = (idx: number, val: number) => {
    const next = [...counts]
    next[idx].actualQuantity = Math.max(0, val)
    setCounts(next)
  }

  const handleActionClick = (type: 'count' | 'approve' | 'cancel') => {
    if (!detailAudit) return
    setPendingAction({
      type,
      docId: detailAudit.id,
      docNumber: detailAudit.id.substring(0, 8),
      key: generateIdempotencyKey(),
    })
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    try {
      setIsSubmitting(true)
      const { type, docId, key } = pendingAction
      if (type === 'count') {
        const payloadLines: UpdateInventoryAuditLineInput[] = counts.map((c) => ({
          itemId: c.itemId,
          actualQuantity: c.actualQuantity,
          unitId: c.unitId,
          batchId: c.batchId,
        }))
        await inventoryAuditsService.count(docId, { lines: payloadLines }, key)
      } else if (type === 'approve') {
        await inventoryAuditsService.approve(docId, key)
      } else if (type === 'cancel') {
        await inventoryAuditsService.cancel(docId, key)
      }
      setPendingAction(null)
      refetch()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Инвентаризация">
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
      <Layout title="Инвентаризация">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить инвентаризации</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Инвентаризация">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">
          Всего: <strong>{audits.length}</strong> | Завершено: <strong className="text-[#5A8A6E]">{audits.filter((a) => a.status === 'approved').length}</strong> | В работе: <strong className="text-[#F0A830]">{audits.filter((a) => a.status === 'draft' || a.status === 'counted').length}</strong>
        </span>
        <button onClick={() => { setShowForm(!showForm); setLocationId(''); setCounts([]) }} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2">
          <Plus size={15} strokeWidth={2.5} /> Создать инвентаризацию
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateAudit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold">Новая инвентаризационная ведомость</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Склад / Зона подсчёта</label>
              <select value={locationId} onChange={(e) => handleLocationChange(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]">
                <option value="">Выберите склад...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({(loc.locationType || loc.type) === 'WORKSHOP' ? 'Цех' : 'Склад'})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-[11px] text-[#9E9E9E] mb-2">Ведомость автоматически заполняется расчетными остатками выбранной зоны.</span>
            </div>
          </div>

          {locationId && counts.length > 0 && (
            <div className="border border-[#D4CFC8] rounded overflow-hidden mb-4">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#EFEBE6] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-[11px] font-semibold text-left">Номенклатура</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-center w-28">Партия</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Учёт (расчёт)</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-right w-28">Факт (подсчёт)</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-center w-16">Ед.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEBE6]">
                    {counts.map((it, idx) => (
                      <tr key={idx} className="bg-white hover:bg-[#F6F5F2]/50">
                        <td className="px-3 py-1.5 text-[12px] font-medium">{it.itemName}</td>
                        <td className="px-3 py-1.5 text-[11px] font-mono text-center text-[#5E5E5E]">{it.batchNumber || '—'}</td>
                        <td className="px-3 py-1.5 text-[12px] text-right font-mono text-[#5E5E5E]">{it.expectedQuantity.toLocaleString()}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            value={it.actualQuantity}
                            onChange={(e) => handleActualQtyChange(idx, Number(e.target.value))}
                            className="h-8 w-24 ml-auto px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-right block focus:outline-none focus:border-[#C0563F]"
                            min="0"
                            step="0.001"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center text-[12px] text-[#5E5E5E]">{it.unitSymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button>
            <button type="submit" disabled={isSubmitting || !locationId} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">
              {isSubmitting ? 'Сохранение...' : 'Создать'}
            </button>
          </div>
        </form>
      )}

      {/* Detail card */}
      {detailAudit && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">{detailAudit.id}</span>
              <span className="text-[14px] font-semibold text-[#2B2B2B]">{detailAudit.location}</span>
              <span className="text-[12px] text-[#5E5E5E]">{detailAudit.date}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                detailAudit.status === 'approved' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' :
                detailAudit.status === 'counted' ? 'bg-[#2A5C8D]/15 text-[#2A5C8D]' :
                detailAudit.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' :
                'bg-[#C0563F]/15 text-[#C0563F]'
              }`}>
                {detailAudit.status === 'approved' ? 'Утвержден' :
                 detailAudit.status === 'counted' ? 'Подсчитан' :
                 detailAudit.status === 'draft' ? 'Черновик' : 'Отменен'}
              </span>
            </div>
            <button onClick={() => { setDetailId(null); setCounts([]) }} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>

          {loadingDetail ? (
            <div className="h-24 flex items-center justify-center text-[12px] text-[#9E9E9E]">Загрузка деталей ведомости...</div>
          ) : (
            <>
              {detailAudit.status === 'draft' && counts.length === 0 && (
                <div className="mb-4">
                  <button onClick={handleStartCountForm} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">
                    Ввести результаты подсчёта
                  </button>
                </div>
              )}

              {counts.length > 0 && detailAudit.status === 'draft' && (
                <div className="mb-4">
                  <h4 className="text-[12px] font-semibold mb-2">Ввод фактических остатков</h4>
                  <div className="max-h-[250px] overflow-y-auto border border-[#D4CFC8] rounded">
                    <table className="w-full">
                      <thead className="bg-[#EFEBE6] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-[11px] font-semibold text-left">Номенклатура</th>
                          <th className="px-3 py-2 text-[11px] font-semibold text-center w-28">Партия</th>
                          <th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Учёт (расчёт)</th>
                          <th className="px-3 py-2 text-[11px] font-semibold text-right w-28">Факт (подсчёт)</th>
                          <th className="px-3 py-2 text-[11px] font-semibold text-center w-16">Ед.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEBE6]">
                        {counts.map((it, idx) => (
                          <tr key={idx} className="bg-white hover:bg-[#F6F5F2]">
                            <td className="px-3 py-1.5 text-[12px]">{it.itemName}</td>
                            <td className="px-3 py-1.5 text-[11px] font-mono text-center text-[#5E5E5E]">{it.batchNumber || '—'}</td>
                            <td className="px-3 py-1.5 text-[12px] text-right font-mono text-[#5E5E5E]">{it.expectedQuantity}</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                value={it.actualQuantity}
                                onChange={(e) => handleActualQtyChange(idx, Number(e.target.value))}
                                className="h-7 w-20 ml-auto px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-right block focus:outline-none focus:border-[#C0563F]"
                                min="0"
                                step="0.001"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-center text-[12px] text-[#5E5E5E]">{it.unitSymbol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleActionClick('count')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#2A5C8D] rounded hover:bg-[#1A4C7D]">
                      Зафиксировать результаты подсчёта
                    </button>
                    <button onClick={() => setCounts([])} className="h-8 px-4 text-[12px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">
                      Свернуть
                    </button>
                  </div>
                </div>
              )}

              {/* Show final discrepancy log if status is NOT draft */}
              {detailAudit.status !== 'draft' && (
                <div className="mb-4">
                  <h4 className="text-[12px] font-semibold mb-2">Ведомость расхождения остатков</h4>
                  <table className="w-full border border-[#D4CFC8]">
                    <thead className="bg-[#EFEBE6]">
                      <tr>
                        <th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё / Продукт</th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-center">Партия</th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-right">Учёт</th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-right">Факт</th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-right">Разница</th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-center">Ед.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEBE6]">
                      {detailAudit.items.map((it, i) => {
                        const diff = it.discrepancy;
                        const diffClass = diff > 0 ? 'text-[#5A8A6E]' : diff < 0 ? 'text-[#C0563F]' : 'text-[#5E5E5E]';
                        const diffText = diff > 0 ? `+${diff}` : String(diff);
                        return (
                          <tr key={i} className="bg-white hover:bg-[#F6F5F2]/50">
                            <td className="px-3 py-2 text-[12px]">{it.materialName}</td>
                            <td className="px-3 py-2 text-[11px] font-mono text-center text-[#5E5E5E]">{it.batchName || '—'}</td>
                            <td className="px-3 py-2 text-[12px] text-right font-mono">{it.expected}</td>
                            <td className="px-3 py-2 text-[12px] text-right font-mono">{it.actual}</td>
                            <td className={`px-3 py-2 text-[12px] text-right font-mono font-medium ${diffClass}`}>{diffText}</td>
                            <td className="px-3 py-2 text-[11px] text-center text-[#5E5E5E]">{it.unit}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                {detailAudit.status === 'counted' && (
                  <button onClick={() => handleActionClick('approve')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">
                    Утвердить расхождения
                  </button>
                )}
                {(detailAudit.status === 'draft' || detailAudit.status === 'counted') && (
                  <button onClick={() => handleActionClick('cancel')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">
                    Отменить инвентаризацию
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#D4CFC8] p-6 max-w-sm w-full mx-4 rounded">
            <h4 className="text-[14px] font-semibold mb-2">Подтвердите операцию</h4>
            <p className="text-[12px] text-[#5E5E5E] mb-4">
              {pendingAction.type === 'count' && 'Записать фактические остатки? Документ перейдет в статус "Подсчитан".'}
              {pendingAction.type === 'approve' && 'Утвердить излишки и недостачи? Будет проведена корректировка остатков на складах. Документ нельзя будет изменить.'}
              {pendingAction.type === 'cancel' && 'Отменить проведение инвентаризации? Документ будет закрыт без изменения остатков.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPendingAction(null)} className="h-9 px-4 text-[12px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]" disabled={isSubmitting}>
                Назад
              </button>
              <button onClick={handleConfirmAction} className={`h-9 px-4 text-[12px] font-medium text-white rounded ${pendingAction.type === 'cancel' ? 'bg-[#C0563F] hover:bg-[#A84835]' : 'bg-[#5A8A6E] hover:bg-[#4A7A5E]'}`} disabled={isSubmitting}>
                {isSubmitting ? 'Выполнение...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#EFEBE6]">
                <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№ ведомости</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Склад / Зона</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Строк</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F5F2]">
              {audits.slice().reverse().map((a, idx) => (
                <tr
                  key={a.id}
                  className={`h-12 cursor-pointer hover:bg-[#EFEBE6] ${detailId === a.id ? 'bg-[#F6F5F2]' : idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'}`}
                  onClick={() => { setDetailId(detailId === a.id ? null : a.id); setCounts([]) }}
                >
                  <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{a.id}</td>
                  <td className="px-4 text-[12px]">{a.date}</td>
                  <td className="px-4 text-[12px] font-medium">{a.location}</td>
                  <td className="px-4 text-[12px] text-right font-mono">{a.items?.length || 0}</td>
                  <td className="px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                      a.status === 'approved' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' :
                      a.status === 'counted' ? 'bg-[#2A5C8D]/15 text-[#2A5C8D]' :
                      a.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' :
                      'bg-[#C0563F]/15 text-[#C0563F]'
                    }`}>
                      {a.status === 'approved' ? 'Утвержден' :
                       a.status === 'counted' ? 'Подсчитан' :
                       a.status === 'draft' ? 'Черновик' : 'Отменен'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
