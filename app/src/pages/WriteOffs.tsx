import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapWriteOff } from '../api/mappers/documents.mapper'
import { mapRawMaterials, mapFinishedProducts } from '../api/mappers/items.mapper'
import type { Item as BackendItem, StockBalanceRow, WriteOffDetail } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

const writeOffTypeLabels = {
  losses: 'Технологические потери',
  defect: 'Брак',
  spoilage: 'Порча',
  inventory: 'Инвентаризационная корректировка',
  other: 'Прочее',
}

const typeOptions: { key: 'losses' | 'defect' | 'spoilage' | 'inventory' | 'other'; label: string }[] = [
  { key: 'losses', label: 'Технологические потери' },
  { key: 'defect', label: 'Брак' },
  { key: 'spoilage', label: 'Порча' },
  { key: 'inventory', label: 'Инвентаризационная корректировка' },
  { key: 'other', label: 'Прочее' },
]

export default function WriteOffs() {
  const { data: writeOffsRes, loading: loadingWriteOffs, error: errorWriteOffs, refetch: refetchWriteOffs } = useApiQuery<{ data: WriteOffDetail[] }>('/api/write-offs', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: BackendItem[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [type, setType] = useState<'losses' | 'defect' | 'spoilage' | 'inventory' | 'other'>('losses')
  const [targetType, setTargetType] = useState<'material' | 'product'>('material')
  const [targetId, setTargetId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [responsible, setResponsible] = useState('')

  const { data: writeOffDetailRes, loading: loadingDetail } = useApiQuery<WriteOffDetail>(
    detailId ? `/api/write-offs/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingWriteOffs || loadingItems
  const error = errorWriteOffs
  const refetch = () => {
    refetchWriteOffs()
  }

  const rawMaterials = mapRawMaterials(
    (itemsRes?.data || []).filter((i) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(i.itemType)),
    balancesRes?.data || []
  )
  const finishedProducts = mapFinishedProducts(
    (itemsRes?.data || []).filter((i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'),
    balancesRes?.data || []
  )

  const targets = targetType === 'material' ? rawMaterials : finishedProducts
  const writeOffs = (writeOffsRes?.data || []).map(mapWriteOff)
  const detailWriteOff = writeOffDetailRes ? mapWriteOff(writeOffDetailRes) : null

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Создание списаний на бэкенде отключено для этой фазы (Read-Only).')
    setShowForm(false); setType('losses'); setTargetId(''); setQuantity(''); setReason(''); setResponsible('')
  }

  if (loading) {
    return (
      <Layout title="Списания">
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
      <Layout title="Списания">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить списания</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
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
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Тип</label><select value={type} onChange={(e) => setType(e.target.value as any)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded">{typeOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Объект</label><select value={targetType} onChange={(e) => { setTargetType(e.target.value as 'material' | 'product'); setTargetId('') }} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="material">Сырьё</option><option value="product">Готовая продукция</option></select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Наименование</label><select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Количество</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" min="0" step="0.01" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Причина</label><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Укажите причину..." className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Ответственный</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" disabled={!targetId || !quantity} className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835] disabled:opacity-50">Создать</button></div>
        </form>
      )}

      {/* Detail card */}
      {detailWriteOff && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">Код: {detailWriteOff.id}</span>
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
                <div><span className="text-[#9E9E9E]">Тип:</span> <span className="font-medium">{writeOffTypeLabels[detailWriteOff.type as keyof typeof writeOffTypeLabels]}</span></div>
                <div><span className="text-[#9E9E9E]">Количество:</span> <span className="font-medium">{detailWriteOff.quantity} {detailWriteOff.unit}</span></div>
                <div><span className="text-[#9E9E9E]">Причина:</span> <span className="font-medium">{detailWriteOff.reason || '—'}</span></div>
                <div><span className="text-[#9E9E9E]">Ответственный:</span> <span className="font-medium">{detailWriteOff.responsible}</span></div>
              </div>
              <div className="flex gap-2">
                {detailWriteOff.status === 'draft' && (
                  <button onClick={() => alert('Проведение списаний отключено для этой фазы (Read-Only).')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">
                    Провести
                  </button>
                )}
                {detailWriteOff.status === 'draft' && (
                  <button onClick={() => alert('Отмена списаний отключена для этой фазы (Read-Only).')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">
                    Отменить
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          {writeOffs.length === 0 ? (
            <div className="text-center p-8 text-[13px] text-[#5E5E5E]">Нет списаний.</div>
          ) : (
            <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Тип</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Объект</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Кол-во</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Причина</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Ответственный</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]"></th>
            </tr></thead>
              <tbody className="divide-y divide-[#F6F5F2]">{writeOffs.map((w) => (
                <tr key={w.id} className={`h-12 hover:bg-[#EFEBE6] cursor-pointer ${detailId === w.id ? 'bg-[#F6F5F2]' : 'bg-white'}`} onClick={() => setDetailId(detailId === w.id ? null : w.id)}>
                  <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{w.id}</td><td className="px-4 text-[12px]">{w.date}</td>
                  <td className="px-4 text-[12px]"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${w.type === 'losses' ? 'bg-[#F0A830]/10 text-[#F0A830]' : w.type === 'defect' ? 'bg-[#C0563F]/10 text-[#C0563F]' : w.type === 'spoilage' ? 'bg-[#C0563F]/10 text-[#C0563F]' : w.type === 'inventory' ? 'bg-[#2A5C8D]/10 text-[#2A5C8D]' : 'bg-[#9E9E9E]/10 text-[#9E9E9E]'}`}>{writeOffTypeLabels[w.type as keyof typeof writeOffTypeLabels] || w.type}</span></td>
                  <td className="px-4 text-[12px]">{w.targetName} <span className="text-[10px] text-[#9E9E9E]">({w.targetType === 'material' ? 'сырьё' : 'продукция'})</span></td>
                  <td className="px-4 text-[12px] text-right font-mono">{w.quantity} {w.unit}</td>
                  <td className="px-4 text-[12px] text-[#5E5E5E]">{w.reason}</td>
                  <td className="px-4 text-[12px] text-[#5E5E5E]">{w.responsible}</td>
                  <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${w.status === 'posted' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : w.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{w.status === 'posted' ? 'Проведен' : w.status === 'draft' ? 'Черновик' : 'Отменен'}</span></td>
                  <td className="px-4 text-center">{w.status === 'draft' && <button onClick={(e) => { e.stopPropagation(); alert('Проведение списаний отключено для этой фазы (Read-Only).'); }} className="text-[11px] text-[#5A8A6E] font-medium">Провести</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
