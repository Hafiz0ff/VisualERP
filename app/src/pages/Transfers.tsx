import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapTransfer } from '../api/mappers/documents.mapper'
import { mapRawMaterials } from '../api/mappers/items.mapper'
import { mapStockBatches } from '../api/mappers/stock.mapper'
import { transfersService, type CreateTransferLineInput } from '../api/services/transfers.service'
import { generateIdempotencyKey } from '../api/idempotency'
import { handleApiError } from '../api/errors'
import type { Item as BackendItem, StockBalanceRow, StockBatch, TransferDetail, StockLocation } from '../api/types'
import { Plus, X } from 'lucide-react'

interface ItemRow {
  materialId: string;
  materialName: string;
  batchId?: string;
  quantity: number;
  unit: string;
  unitId: string;
}

export default function Transfers() {
  const { data: transfersRes, refetch: refetchTransfers } = useApiQuery<{ data: TransferDetail[] }>('/api/transfers', { params: { pageSize: 100 } })
  const { data: itemsRes } = useApiQuery<{ data: BackendItem[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: batchesRes } = useApiQuery<{ data: StockBatch[] }>('/api/stock/batches')
  const { data: locationsRes } = useApiQuery<{ data: StockLocation[] }>('/api/locations')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [responsible, setResponsible] = useState('')
  const [comment, setComment] = useState('')
  const [sourceLocationId, setSourceLocationId] = useState('')
  const [targetLocationId, setTargetLocationId] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ materialId: '', materialName: '', quantity: 0, unit: '', unitId: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [pendingAction, setPendingAction] = useState<{
    type: 'post' | 'cancel';
    docId: string;
    docNumber?: string;
    key: string;
  } | null>(null)

  const { data: transferDetailRes, loading: loadingDetail, refetch: refetchDetail } = useApiQuery<TransferDetail>(
    detailId ? `/api/transfers/${detailId}` : '',
    { enabled: !!detailId }
  )

  const refetch = () => {
    refetchTransfers()
    if (detailId) refetchDetail()
  }

  const rawMaterials = mapRawMaterials(
    (itemsRes?.data || []).filter((i) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(i.itemType)),
    balancesRes?.data || []
  )

  const locations = (locationsRes?.data || []).filter((l) => l.isActive)
  const batches = mapStockBatches(batchesRes?.data || [])
  const transferOrders = (transfersRes?.data || []).map(mapTransfer)
  const detailTransfer = transferDetailRes ? mapTransfer(transferDetailRes) : null

  const mbc = rawMaterials.reduce<Record<string, typeof rawMaterials>>((a, m) => { if (!a[m.category]) a[m.category] = []; a[m.category].push(m); return a }, {})

  const hChange = (i: number, f: keyof ItemRow, v: unknown) => {
    const ni = [...items]
    if (f === 'materialId') {
      const originalItem = (itemsRes?.data || []).find((x) => x.id === v)
      const m = rawMaterials.find((x) => x.id === v)
      ni[i] = {
        ...ni[i],
        materialId: v as string,
        materialName: m?.name || '',
        unit: m?.unit || '',
        unitId: originalItem?.unit.id || '',
      }
    } else if (f === 'quantity') {
      ni[i] = { ...ni[i], quantity: Number(v) }
    } else if (f === 'batchId') {
      ni[i] = { ...ni[i], batchId: v as string }
    }
    setItems(ni)
  }

  const hSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceLocationId || !targetLocationId) {
      alert('Пожалуйста, выберите склады отправления и назначения')
      return
    }
    if (sourceLocationId === targetLocationId) {
      alert('Склад отправления и назначения не могут совпадать')
      return
    }
    try {
      setIsSubmitting(true)
      const payloadLines: CreateTransferLineInput[] = items.map((it) => ({
        itemId: it.materialId,
        quantity: it.quantity,
        unitId: it.unitId,
        batchId: it.batchId || null,
      }))

      await transfersService.create({
        date: new Date().toISOString(),
        sourceLocationId,
        targetLocationId,
        lines: payloadLines,
      })

      setShowForm(false)
      setSourceLocationId('')
      setTargetLocationId('')
      setItems([{ materialId: '', materialName: '', quantity: 0, unit: '', unitId: '' }])
      refetchTransfers()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActionClick = (type: 'post' | 'cancel', docId: string, docNumber?: string) => {
    setPendingAction({
      type,
      docId,
      docNumber,
      key: generateIdempotencyKey(),
    })
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    try {
      setIsSubmitting(true)
      const { type, docId, key } = pendingAction
      if (type === 'post') {
        await transfersService.post(docId, key)
      } else {
        await transfersService.cancel(docId, key)
      }
      setPendingAction(null)
      refetch()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout title="Передачи сырья">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{transferOrders.length}</strong> | Ожидают: <strong className="text-[#F0A830]">{transferOrders.filter((t) => t.status === 'pending').length}</strong></span>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать передачу</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новая заявка на перемещение</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Откуда (Склад-источник)</label>
              <select value={sourceLocationId} onChange={(e) => setSourceLocationId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите склад...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.locationType || l.type})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Куда (Склад-получатель)</label>
              <select value={targetLocationId} onChange={(e) => setTargetLocationId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите склад...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.locationType || l.type})</option>)}
              </select>
            </div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Ответственный</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Комментарий</label><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" /></div>
          </div>
          <div className="border border-[#D4CFC8] rounded overflow-hidden mb-4">
            <table className="w-full"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-28">Партия</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-24">Кол-во</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-16">Ед.</th><th className="px-3 py-2 text-[11px] w-8"></th></tr></thead>
              <tbody className="divide-y divide-[#EFEBE6]">{items.map((it, idx) => {
                const matBatches = batches.filter((b) => b.materialId === it.materialId && b.remaining > 0)
                return (<tr key={idx} className="bg-white">
                  <td className="px-3 py-2"><select value={it.materialId} onChange={(e) => hChange(idx, 'materialId', e.target.value)} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{Object.entries(mbc).map(([cat, mats]) => <optgroup key={cat} label={cat}>{mats.map((m) => <option key={m.id} value={m.id}>{m.name} (ост. {m.warehouseStock} {m.unit})</option>)}</optgroup>)}</select></td>
                  <td className="px-3 py-2"><select value={it.batchId || ''} onChange={(e) => hChange(idx, 'batchId', e.target.value)} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Без партии</option>{matBatches.map((b) => <option key={b.id} value={b.id}>{b.id} ({b.remaining} {b.unit})</option>)}</select></td>
                  <td className="px-3 py-2"><input type="number" value={it.quantity || ''} onChange={(e) => hChange(idx, 'quantity', Number(e.target.value))} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-center" min="0" step="0.1" /></td>
                  <td className="px-3 py-2 text-center text-[12px] text-[#5E5E5E]">{it.unit || '-'}</td>
                  <td className="px-3 py-2 text-center">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== idx))} className="text-[#9E9E9E] hover:text-[#C0563F]"><X size={14} /></button>}</td>
                </tr>)
              })}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => setItems([...items, { materialId: '', materialName: '', quantity: 0, unit: '', unitId: '' }])} className="mb-4 text-[12px] text-[#C0563F] font-medium flex items-center gap-1"><Plus size={12} /> Добавить строку</button>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" disabled={isSubmitting} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">{isSubmitting ? 'Сохранение...' : 'Создать'}</button></div>
        </form>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#D4CFC8] p-6 max-w-sm w-full mx-4 rounded">
            <h4 className="text-[14px] font-semibold mb-2">Подтвердите операцию</h4>
            <p className="text-[12px] text-[#5E5E5E] mb-4">
              {pendingAction.type === 'post'
                ? 'Провести перемещение сырья? Это зафиксирует списание со склада-источника и приход на склад-получатель.'
                : 'Отменить перемещение сырья? Это аннулирует накладную и вернет остатки сырья.'}
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

      {/* Detail card */}
      {detailTransfer && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">{detailTransfer.id}</span>
              <span className="text-[12px] text-[#5E5E5E]">{detailTransfer.date}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${detailTransfer.status === 'completed' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : detailTransfer.status === 'pending' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{detailTransfer.status === 'completed' ? 'Выполнено' : detailTransfer.status === 'pending' ? 'Ожидает' : 'Отменена'}</span>
            </div>
            <button onClick={() => setDetailId(null)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>
          {loadingDetail ? (
            <div className="h-24 flex items-center justify-center text-[12px] text-[#9E9E9E]">Загрузка деталей перемещения...</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-4 text-[12px]">
                <div><span className="text-[#9E9E9E]">Откуда:</span> <span className="font-medium">{detailTransfer.fromLocation}</span></div>
                <div><span className="text-[#9E9E9E]">Куда:</span> <span className="font-medium">{detailTransfer.toLocation}</span></div>
                <div><span className="text-[#9E9E9E]">Ответственный:</span> <span className="font-medium">{detailTransfer.responsible}</span></div>
                <div><span className="text-[#9E9E9E]">Комментарий:</span> <span className="font-medium">{detailTransfer.comment || '—'}</span></div>
              </div>
              <h4 className="text-[12px] font-semibold mb-2">Список сырья</h4>
              <table className="w-full border border-[#D4CFC8]"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center">Партия</th><th className="px-3 py-2 text-[11px] font-semibold text-right">Количество</th><th className="px-3 py-2 text-[11px] font-semibold text-center">Ед.</th></tr></thead>
                <tbody className="divide-y divide-[#EFEBE6]">{detailTransfer.items.map((it, i) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{it.materialName}</td><td className="px-3 py-2 text-[11px] font-mono text-center text-[#5E5E5E]">{it.batchName || it.batchId || '—'}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{it.quantity}</td><td className="px-3 py-2 text-[11px] text-center">{it.unit}</td></tr>))}</tbody>
              </table>
              {detailTransfer.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleActionClick('post', detailTransfer.id, detailTransfer.id.substring(0, 8))} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">Принять передачу</button>
                  <button onClick={() => handleActionClick('cancel', detailTransfer.id, detailTransfer.id.substring(0, 8))} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Отменить перемещение</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Маршрут</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Сырьё</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Ответственный</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th>
          </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">{transferOrders.slice().reverse().map((t) => (
              <tr key={t.id} className={`h-12 hover:bg-[#EFEBE6] cursor-pointer ${detailId === t.id ? 'bg-[#F6F5F2]' : 'bg-white'}`} onClick={() => setDetailId(detailId === t.id ? null : t.id)}>
                <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{t.id}</td>
                <td className="px-4 text-[12px]">{t.date}</td>
                <td className="px-4 text-[12px] font-medium">{t.fromLocation} ➔ {t.toLocation}</td>
                <td className="px-4 text-[12px]">{t.items.length} поз.<br/><span className="text-[10px] text-[#9E9E9E]">{t.items.map((it) => it.materialName).join(', ')}</span></td>
                <td className="px-4 text-[12px]">{t.responsible}</td>
                <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${t.status === 'completed' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : t.status === 'pending' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{t.status === 'completed' ? 'Выполнено' : t.status === 'pending' ? 'Ожидает' : 'Отменена'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
