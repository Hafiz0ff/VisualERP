import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapWriteOff } from '../api/mappers/documents.mapper'
import { writeOffsService, type CreateWriteOffLineInput } from '../api/services/writeOffs.service'
import { generateIdempotencyKey } from '../api/idempotency'
import { handleApiError } from '../api/errors'
import type { Item, WriteOffDetail, StockLocation } from '../api/types'
import { Plus, X } from 'lucide-react'
import { formatNumber } from '@/lib/number-format'

const writeOffReasons = [
  { key: 'TECHNOLOGICAL_LOSS', label: 'Технологические потери' },
  { key: 'DEFECT', label: 'Брак' },
  { key: 'DAMAGE', label: 'Порча/Повреждение' },
  { key: 'INVENTORY_CORRECTION', label: 'Корректировка остатков' },
  { key: 'SAMPLE', label: 'Отбор образцов' },
  { key: 'OTHER', label: 'Другое' },
] as const

type WriteOffReasonKey = (typeof writeOffReasons)[number]['key']

export default function WriteOffs() {
  const { data: writeOffsRes, refetch: refetchWriteOffs } = useApiQuery<{ data: WriteOffDetail[] }>('/api/write-offs', { params: { pageSize: 100 } })
  const { data: itemsRes } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 100 } })
  const { data: locationsRes } = useApiQuery<{ data: StockLocation[] }>('/api/locations')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [reason, setReason] = useState<WriteOffReasonKey>('TECHNOLOGICAL_LOSS')
  const [targetType, setTargetType] = useState<'material' | 'product'>('material')
  const [targetId, setTargetId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [pendingAction, setPendingAction] = useState<{
    type: 'post' | 'cancel';
    docId: string;
    docNumber?: string;
    key: string;
  } | null>(null)

  const { data: writeOffDetailRes, loading: loadingDetail, refetch: refetchDetail } = useApiQuery<WriteOffDetail>(
    detailId ? `/api/write-offs/${detailId}` : '',
    { enabled: !!detailId }
  )

  const refetch = () => {
    refetchWriteOffs()
    if (detailId) refetchDetail()
  }

  const writeOffs = (writeOffsRes?.data || []).map(mapWriteOff)
  const locations = (locationsRes?.data || []).filter((l) => l.isActive)
  const detailWriteOff = writeOffDetailRes ? mapWriteOff(writeOffDetailRes) : null

  const targets = (itemsRes?.data || []).filter((it) => {
    if (targetType === 'material') {
      return ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(it.itemType)
    } else {
      return ['FINISHED_PRODUCT', 'SEMI_FINISHED'].includes(it.itemType)
    }
  })

  const hSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationId || !targetId || !quantity) {
      alert('Заполните обязательные поля формы')
      return
    }
    const selectedItem = (itemsRes?.data || []).find((it) => it.id === targetId)
    if (!selectedItem) return

    try {
      setIsSubmitting(true)
      const lines: CreateWriteOffLineInput[] = [
        {
          itemId: targetId,
          quantity: Number(quantity),
          unitId: selectedItem.unit.id,
          batchId: null, // FIFO resolution on backend
        },
      ]

      await writeOffsService.create({
        date: new Date().toISOString(),
        locationId,
        reason,
        description: description || null,
        lines,
      })

      setShowForm(false)
      setLocationId('')
      setTargetId('')
      setQuantity('')
      setDescription('')
      setReason('TECHNOLOGICAL_LOSS')
      refetchWriteOffs()
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
        await writeOffsService.post(docId, key)
      } else {
        await writeOffsService.cancel(docId, key)
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
    <Layout title="Списания">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{writeOffs.length}</strong> | Проведено: <strong className="text-[#5A8A6E]">{writeOffs.filter((w) => w.status === 'posted').length}</strong></span>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать списание</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новое списание</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Склад списания</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                <option value="">Выберите склад...</option>
                {locations.map((l) => {
                  const kind = l.locationType || l.type;
                  return <option key={l.id} value={l.id}>{l.name} ({kind === 'WORKSHOP' ? 'Цех' : 'Склад'})</option>;
                })}
              </select>
            </div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Объект списания</label><select value={targetType} onChange={(e) => { setTargetType(e.target.value as 'material' | 'product'); setTargetId('') }} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="material">Сырьё</option><option value="product">Готовая продукция</option></select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Наименование</label><select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none"><option value="">Выберите...</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Количество</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" min="0" step="0.01" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[12px] text-[#5E5E5E] block mb-1">Категория списания</label>
              <select value={reason} onChange={(e) => setReason(e.target.value as WriteOffReasonKey)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none">
                {writeOffReasons.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Детали/Причина</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Детали повреждения/списания" className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Ответственный</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none" /></div>
          </div>
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
                ? 'Провести списание запасов? Это действие уменьшит количество выбранного товара на выбранном складе.'
                : 'Отменить списание запасов? Это действие вернет списанный товар обратно на склад.'}
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
      {detailWriteOff && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">Документ: {detailWriteOff.number}</span>
              <span className="text-[18px] font-semibold text-[#2B2B2B]">{detailWriteOff.targetName}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${detailWriteOff.status === 'posted' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : detailWriteOff.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>
                {detailWriteOff.status === 'posted' ? 'Проведен' : detailWriteOff.status === 'draft' ? 'Черновик' : 'Отменен'}
              </span>
            </div>
            <button onClick={() => setDetailId(null)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>
          {loadingDetail ? (
            <div className="h-24 flex items-center justify-center text-[12px] text-[#9E9E9E]">Загрузка деталей списания...</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-4 text-[12px]">
                <div><span className="text-[#9E9E9E]">Объект:</span> <span className="font-medium">{detailWriteOff.targetName}</span></div>
                <div><span className="text-[#9E9E9E]">Количество:</span> <span className="font-medium">{formatNumber(detailWriteOff.quantity)} {detailWriteOff.unit}</span></div>
                <div><span className="text-[#9E9E9E]">Причина/Категория:</span> <span className="font-medium">{writeOffReasons.find((r) => r.key === writeOffDetailRes?.reason)?.label || detailWriteOff.type}</span></div>
                <div><span className="text-[#9E9E9E]">Склад списания:</span> <span className="font-medium">{writeOffDetailRes?.location.name}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
                <div><span className="text-[#9E9E9E]">Детали списания:</span> <span className="font-medium">{detailWriteOff.reason || '—'}</span></div>
                <div><span className="text-[#9E9E9E]">Ответственный:</span> <span className="font-medium">{detailWriteOff.responsible}</span></div>
              </div>
              {detailWriteOff.status === 'draft' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleActionClick('post', detailWriteOff.id, detailWriteOff.number)} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">Провести списание</button>
                  <button onClick={() => handleActionClick('cancel', detailWriteOff.id, detailWriteOff.number)} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Отменить</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№ списания</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Объект списания</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Количество</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Категория списания</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th>
          </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">{writeOffs.slice().reverse().map((w) => (
              <tr key={w.id} className={`h-12 cursor-pointer hover:bg-[#EFEBE6] ${detailId === w.id ? 'bg-[#F6F5F2]' : 'bg-white'}`} onClick={() => setDetailId(detailId === w.id ? null : w.id)}>
                <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{w.number}</td>
                <td className="px-4 text-[12px]">{w.date}</td>
                <td className="px-4 text-[12px] font-medium">{w.targetName}</td>
                <td className="px-4 text-[12px] text-right font-mono">{formatNumber(w.quantity)} {w.unit}</td>
                <td className="px-4 text-[12px]">{writeOffReasons.find((r) => r.key === (writeOffsRes?.data || []).find((x) => x.id === w.id)?.reason)?.label || w.type}</td>
                <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${w.status === 'posted' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : w.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{w.status === 'posted' ? 'Проведен' : w.status === 'draft' ? 'Черновик' : 'Отменен'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
