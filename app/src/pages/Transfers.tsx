import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapTransfer } from '../api/mappers/documents.mapper'
import { mapRawMaterials } from '../api/mappers/items.mapper'
import { mapStockBatches } from '../api/mappers/stock.mapper'
import type { Item as BackendItem, StockBalanceRow, StockBatch, TransferDetail } from '../api/types'
import { Plus, X, ArrowRightLeft, AlertTriangle } from 'lucide-react'

interface Item { materialId: string; materialName: string; batchId?: string; quantity: number; unit: string }

export default function Transfers() {
  const { data: transfersRes, loading: loadingTransfers, error: errorTransfers, refetch: refetchTransfers } = useApiQuery<{ data: TransferDetail[] }>('/api/transfers', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: BackendItem[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')
  const { data: batchesRes } = useApiQuery<{ data: StockBatch[] }>('/api/stock/batches')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [responsible, setResponsible] = useState('')
  const [comment, setComment] = useState('')
  const [items, setItems] = useState<Item[]>([{ materialId: '', materialName: '', quantity: 0, unit: '' }])

  const { data: transferDetailRes, loading: loadingDetail } = useApiQuery<TransferDetail>(
    detailId ? `/api/transfers/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingTransfers || loadingItems
  const error = errorTransfers
  const refetch = () => {
    refetchTransfers()
  }

  const rawMaterials = mapRawMaterials(
    (itemsRes?.data || []).filter((i) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(i.itemType)),
    balancesRes?.data || []
  )

  const batches = mapStockBatches(batchesRes?.data || [])
  const transferOrders = (transfersRes?.data || []).map(mapTransfer)
  const detailTransfer = transferDetailRes ? mapTransfer(transferDetailRes) : null

  const mbc = rawMaterials.reduce<Record<string, typeof rawMaterials>>((a, m) => { if (!a[m.category]) a[m.category] = []; a[m.category].push(m); return a }, {})

  const hChange = (i: number, f: keyof Item, v: unknown) => {
    const ni = [...items]
    if (f === 'materialId') { const m = rawMaterials.find((x) => x.id === v); ni[i] = { ...ni[i], materialId: v as string, materialName: m?.name || '', unit: m?.unit || '' } }
    else if (f === 'quantity') ni[i] = { ...ni[i], quantity: Number(v) }
    else if (f === 'batchId') ni[i] = { ...ni[i], batchId: v as string }
    setItems(ni)
  }

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Создание перемещений на бэкенде отключено для этой фазы (Read-Only).')
    setShowForm(false)
  }

  if (loading) {
    return (
      <Layout title="Передачи сырья">
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
      <Layout title="Передачи сырья">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить перемещения сырья</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Передачи сырья">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{transferOrders.length}</strong> | Ожидают: <strong className="text-[#F0A830]">{transferOrders.filter((t) => t.status === 'pending').length}</strong></span>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать передачу</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новая заявка</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Ответственный</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Комментарий</label><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
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
          <button type="button" onClick={() => setItems([...items, { materialId: '', materialName: '', quantity: 0, unit: '' }])} className="mb-4 text-[12px] text-[#C0563F] font-medium flex items-center gap-1"><Plus size={12} /> Добавить строку</button>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Создать</button></div>
        </form>
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
                <tbody className="divide-y divide-[#EFEBE6]">{detailTransfer.items.map((it: any, i: number) => (<tr key={i} className="bg-white"><td className="px-3 py-2 text-[12px]">{it.materialName}</td><td className="px-3 py-2 text-[11px] font-mono text-center text-[#5E5E5E]">{it.batchName || it.batchId || '—'}</td><td className="px-3 py-2 text-[12px] text-right font-mono">{it.quantity}</td><td className="px-3 py-2 text-[11px] text-center">{it.unit}</td></tr>))}</tbody>
              </table>
              {detailTransfer.status === 'pending' && <div className="mt-3"><button onClick={() => { alert('Проведение перемещений на бэкенде отключено для этой фазы (Read-Only).'); }} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">Принять передачу</button></div>}
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Маршрут</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Сырьё</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Ответственный</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]"></th>
          </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">{transferOrders.slice().reverse().map((t) => (
              <tr key={t.id} className={`h-12 hover:bg-[#EFEBE6] cursor-pointer ${detailId === t.id ? 'bg-[#F6F5F2]' : 'bg-white'}`} onClick={() => setDetailId(detailId === t.id ? null : t.id)}>
                <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{t.id}</td>
                <td className="px-4 text-[12px]">{t.date}</td>
                <td className="px-4 text-[12px]"><span className="flex items-center gap-1"><span>{t.fromLocation}</span><ArrowRightLeft size={10} className="text-[#9E9E9E]" /><span>{t.toLocation}</span></span></td>
                <td className="px-4 text-[12px]">{t.items.length} поз.<br/><span className="text-[10px] text-[#9E9E9E]">{t.items.map((i: any) => `${i.materialName}${i.batchId ? ` (${i.batchId})` : ''}`).join(', ')}</span></td>
                <td className="px-4 text-[12px] text-[#5E5E5E]">{t.responsible}</td>
                <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${t.status === 'completed' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : t.status === 'pending' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{t.status === 'completed' ? 'Выполнено' : t.status === 'pending' ? 'Ожидает' : 'Отменена'}</span></td>
                <td className="px-4 text-center">{t.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); alert('Проведение перемещений на бэкенде отключено для этой фазы (Read-Only).'); }} className="text-[11px] text-[#5A8A6E] font-medium">Принять</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
