import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapPurchaseReceipt } from '../api/mappers/documents.mapper'
import { mapRawMaterials } from '../api/mappers/items.mapper'
import type { Item, StockBalanceRow, PurchaseReceiptDetail } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

interface InItem { materialId: string; materialName: string; batchName: string; quantity: number; unit: string; pricePerUnit: number; total: number }

export default function IncomingMaterials() {
  const { data: receiptsRes, loading: loadingReceipts, error: errorReceipts, refetch: refetchReceipts } = useApiQuery<{ data: PurchaseReceiptDetail[] }>('/api/purchase-receipts', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const loading = loadingReceipts || loadingItems
  const error = errorReceipts
  const refetch = () => {
    refetchReceipts()
  }

  const [showForm, setShowForm] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [warehouse, setWarehouse] = useState('Основной склад')
  const [comment, setComment] = useState('')
  const [items, setItems] = useState<InItem[]>([{ materialId: '', materialName: '', batchName: '', quantity: 0, unit: '', pricePerUnit: 0, total: 0 }])
  const [statusFilter, setStatusFilter] = useState('all')

  const rawMaterials = mapRawMaterials(
    (itemsRes?.data || []).filter((i) => ['MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE'].includes(i.itemType)),
    balancesRes?.data || []
  )

  const incomingDocuments = (receiptsRes?.data || []).map(mapPurchaseReceipt)

  const mbc = rawMaterials.reduce<Record<string, typeof rawMaterials>>((a, m) => { if (!a[m.category]) a[m.category] = []; a[m.category].push(m); return a }, {})

  const hChange = (i: number, f: keyof InItem, v: unknown) => {
    const ni = [...items]
    if (f === 'materialId') {
      const m = rawMaterials.find((x) => x.id === v)
      ni[i] = { ...ni[i], materialId: v as string, materialName: m?.name || '', unit: m?.unit || '', total: ni[i].quantity * ni[i].pricePerUnit }
    } else if (f === 'quantity') {
      const q = Number(v)
      ni[i] = { ...ni[i], quantity: q, total: q * ni[i].pricePerUnit }
    } else if (f === 'pricePerUnit') {
      const p = Number(v)
      ni[i] = { ...ni[i], pricePerUnit: p, total: ni[i].quantity * p }
    } else {
      ni[i] = { ...ni[i], [f]: v as any }
    }
    setItems(ni)
  }

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Local mock write warning/bypass
    alert('Создание документов на бэкенде отключено для этой фазы (Read-Only).')
    setShowForm(false)
  }

  const filtered = statusFilter === 'all' ? incomingDocuments : incomingDocuments.filter((d) => d.status === statusFilter)

  if (loading) {
    return (
      <Layout title="Приход сырья">
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
      <Layout title="Приход сырья">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить приходные накладные</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Приход сырья">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{incomingDocuments.length}</strong> | Проведено: <strong className="text-[#5A8A6E]">{incomingDocuments.filter((d) => d.status === 'posted').length}</strong> | Черновики: <strong className="text-[#F0A830]">{incomingDocuments.filter((d) => d.status === 'draft').length}</strong></span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded">
            <option value="all">Все статусы</option><option value="draft">Черновик</option><option value="posted">Проведен</option><option value="cancelled">Отменен</option>
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать приход</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новый документ прихода</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Поставщик</label><input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Название поставщика" className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Склад</label><select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option>Основной склад</option><option>Склад №2</option></select></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Комментарий</label><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" /></div>
          </div>
          <div className="border border-[#D4CFC8] rounded overflow-hidden mb-4">
            <table className="w-full"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Сырьё</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-28">Партия</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-24">Кол-во</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-16">Ед.</th><th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Цена</th><th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Сумма</th><th className="px-3 py-2 text-[11px] w-8"></th></tr></thead>
              <tbody className="divide-y divide-[#EFEBE6]">{items.map((it, idx) => (<tr key={idx} className="bg-white">
                <td className="px-3 py-2"><select value={it.materialId} onChange={(e) => hChange(idx, 'materialId', e.target.value)} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{Object.entries(mbc).map(([cat, mats]) => <optgroup key={cat} label={cat}>{mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>)}</select></td>
                <td className="px-3 py-2"><input type="text" value={it.batchName} onChange={(e) => hChange(idx, 'batchName', e.target.value)} placeholder="№ партии" className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-center" /></td>
                <td className="px-3 py-2"><input type="number" value={it.quantity || ''} onChange={(e) => hChange(idx, 'quantity', Number(e.target.value))} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-center" min="0" step="0.1" /></td>
                <td className="px-3 py-2 text-center text-[12px] text-[#5E5E5E]">{it.unit || '-'}</td>
                <td className="px-3 py-2"><input type="number" value={it.pricePerUnit || ''} onChange={(e) => hChange(idx, 'pricePerUnit', Number(e.target.value))} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-right" /></td>
                <td className="px-3 py-2 text-[12px] text-right font-mono">{it.total.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== idx))} className="text-[#9E9E9E] hover:text-[#C0563F]"><X size={14} /></button>}</td>
              </tr>))}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => setItems([...items, { materialId: '', materialName: '', batchName: '', quantity: 0, unit: '', pricePerUnit: 0, total: 0 }])} className="mb-4 text-[12px] text-[#C0563F] font-medium flex items-center gap-1"><Plus size={12} /> Добавить строку</button>
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#5E5E5E]">Итого: <strong className="text-[#2B2B2B]">{items.reduce((s, it) => s + it.total, 0).toLocaleString()} ₽</strong></div>
            <div className="flex items-center gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Создать</button></div>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№ док.</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Поставщик</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Склад</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Позиций</th><th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Сумма</th>
            <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]"></th>
          </tr></thead>
            <tbody className="divide-y divide-[#F6F5F2]">{filtered.slice().reverse().map((d, idx) => (
              <tr key={d.id} className={`h-12 ${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{d.id}</td><td className="px-4 text-[12px]">{d.date}</td>
                <td className="px-4 text-[12px] font-medium">{d.supplier}</td><td className="px-4 text-[12px] text-[#5E5E5E]">{d.warehouse}</td>
                <td className="px-4 text-[12px]">{d.items.length} поз.<br/><span className="text-[10px] text-[#9E9E9E]">{d.items.map((it: any) => it.materialName).join(', ')}</span></td>
                <td className="px-4 text-[12px] text-right font-mono">{d.totalSum.toLocaleString()} ₽</td>
                <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${d.status === 'posted' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : d.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{d.status === 'posted' ? 'Проведен' : d.status === 'draft' ? 'Черновик' : 'Отменен'}</span></td>
                <td className="px-4 text-center">{d.status === 'draft' && <button onClick={() => alert('Проведение документов на бэкенде отключено для этой фазы (Read-Only).')} className="text-[11px] text-[#5A8A6E] font-medium">Провести</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
