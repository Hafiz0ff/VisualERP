import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapShipment } from '../api/mappers/documents.mapper'
import { mapFinishedProducts } from '../api/mappers/items.mapper'
import type { Item, StockBalanceRow, ShipmentDetail } from '../api/types'
import { Plus, X, AlertTriangle } from 'lucide-react'

interface ShItem { productId: string; productName: string; quantity: number; unit: string; price: number; total: number }

export default function Shipments() {
  const { data: shipmentsRes, loading: loadingShipments, error: errorShipments, refetch: refetchShipments } = useApiQuery<{ data: ShipmentDetail[] }>('/api/shipments', { params: { pageSize: 100 } })
  const { data: itemsRes, loading: loadingItems } = useApiQuery<{ data: Item[] }>('/api/items', { params: { pageSize: 1000 } })
  const { data: balancesRes } = useApiQuery<{ data: StockBalanceRow[] }>('/api/stock/balances')

  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [customer, setCustomer] = useState('')
  const [responsible, setResponsible] = useState('')
  const [comment, setComment] = useState('')
  const [items, setItems] = useState<ShItem[]>([{ productId: '', productName: '', quantity: 0, unit: 'меш', price: 0, total: 0 }])

  const { data: shipmentDetailRes, loading: loadingDetail } = useApiQuery<ShipmentDetail>(
    detailId ? `/api/shipments/${detailId}` : '',
    { enabled: !!detailId }
  )

  const loading = loadingShipments || loadingItems
  const error = errorShipments
  const refetch = () => {
    refetchShipments()
  }

  const finishedOnly = (itemsRes?.data || []).filter(
    (i) => i.itemType === 'FINISHED_PRODUCT' || i.itemType === 'SEMI_FINISHED'
  )
  const finishedProducts = mapFinishedProducts(finishedOnly, balancesRes?.data || [])
  const shipments = (shipmentsRes?.data || []).map(mapShipment)
  const detailShipment = shipmentDetailRes ? mapShipment(shipmentDetailRes) : null

  const hChange = (i: number, f: keyof ShItem, v: unknown) => {
    const ni = [...items]
    if (f === 'productId') {
      const p = finishedProducts.find((x) => x.id === v)
      const price = p?.price || 0
      ni[i] = { ...ni[i], productId: v as string, productName: p?.name || '', price, total: ni[i].quantity * price }
    } else if (f === 'quantity') {
      const q = Number(v)
      ni[i] = { ...ni[i], quantity: q, total: q * ni[i].price }
    } else {
      ni[i] = { ...ni[i], [f]: v }
    }
    setItems(ni)
  }

  const hSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Создание отгрузок на бэкенде отключено для этой фазы (Read-Only).')
    setShowForm(false); setCustomer(''); setResponsible(''); setComment(''); setItems([{ productId: '', productName: '', quantity: 0, unit: 'меш', price: 0, total: 0 }])
  }

  if (loading) {
    return (
      <Layout title="Отгрузки">
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
      <Layout title="Отгрузки">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить отгрузки</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Отгрузки">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#5E5E5E]">Всего: <strong>{shipments.length}</strong> | Отгружено: <strong className="text-[#5A8A6E]">{shipments.filter((s) => s.status === 'shipped').length}</strong> | Черновики: <strong className="text-[#F0A830]">{shipments.filter((s) => s.status === 'draft').length}</strong></span>
        <button onClick={() => setShowForm(!showForm)} className="h-9 px-4 bg-[#C0563F] text-white text-[13px] font-medium rounded hover:bg-[#A84835] flex items-center gap-2"><Plus size={15} strokeWidth={2.5} /> Создать отгрузку</button>
      </div>

      {showForm && (
        <form onSubmit={hSubmit} className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold">Новая отгрузка</h3><button type="button" onClick={() => setShowForm(false)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Клиент</label><input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Название клиента" className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Ответственный</label><input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" /></div>
            <div><label className="text-[12px] text-[#5E5E5E] block mb-1">Комментарий</label><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} className="h-9 w-full px-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded" /></div>
          </div>
          <div className="border border-[#D4CFC8] rounded overflow-hidden mb-4">
            <table className="w-full"><thead className="bg-[#EFEBE6]"><tr><th className="px-3 py-2 text-[11px] font-semibold text-left">Продукт</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-24">Кол-во</th><th className="px-3 py-2 text-[11px] font-semibold text-center w-16">Ед.</th><th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Цена</th><th className="px-3 py-2 text-[11px] font-semibold text-right w-24">Сумма</th><th className="px-3 py-2 text-[11px] w-8"></th></tr></thead>
              <tbody className="divide-y divide-[#EFEBE6]">{items.map((it, idx) => (<tr key={idx} className="bg-white">
                <td className="px-3 py-2"><select value={it.productId} onChange={(e) => hChange(idx, 'productId', e.target.value)} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded"><option value="">Выберите...</option>{finishedProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (ост. {p.stock} {p.unit})</option>)}</select></td>
                <td className="px-3 py-2"><input type="number" value={it.quantity || ''} onChange={(e) => hChange(idx, 'quantity', Number(e.target.value))} className="h-8 w-full px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded text-center" min="1" /></td>
                <td className="px-3 py-2 text-center text-[12px] text-[#5E5E5E]">{it.unit}</td>
                <td className="px-3 py-2 text-[12px] text-right font-mono">{it.price.toLocaleString()}</td>
                <td className="px-3 py-2 text-[12px] text-right font-mono">{it.total.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, j) => j !== idx))} className="text-[#9E9E9E] hover:text-[#C0563F]"><X size={14} /></button>}</td>
              </tr>))}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => setItems([...items, { productId: '', productName: '', quantity: 0, unit: 'меш', price: 0, total: 0 }])} className="mb-4 text-[12px] text-[#C0563F] font-medium flex items-center gap-1"><Plus size={12} /> Добавить</button>
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#5E5E5E]">Итого: <strong className="text-[#2B2B2B]">{items.reduce((s, it) => s + it.total, 0).toLocaleString()} ₽</strong></div>
            <div className="flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 text-[13px] font-medium text-[#5E5E5E] bg-white border border-[#D4CFC8] rounded hover:bg-[#F6F5F2]">Отмена</button><button type="submit" className="h-9 px-5 text-[13px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">Создать</button></div>
          </div>
        </form>
      )}

      {/* Detail card */}
      {detailShipment && (
        <div className="bg-white border border-[#D4CFC8] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-mono font-semibold text-[#2B2B2B]">Код: {detailShipment.id}</span>
              <span className="text-[18px] font-semibold text-[#2B2B2B]">{detailShipment.customer}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${detailShipment.status === 'shipped' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : detailShipment.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>
                {detailShipment.status === 'shipped' ? 'Отгружено' : detailShipment.status === 'draft' ? 'Черновик' : 'Отменено'}
              </span>
            </div>
            <button onClick={() => setDetailId(null)} className="text-[#9E9E9E] hover:text-[#2B2B2B]"><X size={18} /></button>
          </div>
          {loadingDetail ? (
            <div className="h-24 flex items-center justify-center text-[12px] text-[#9E9E9E]">Загрузка деталей...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4 text-[12px]">
                <div><span className="text-[#9E9E9E]">Дата:</span> <span className="font-medium">{detailShipment.date}</span></div>
                <div><span className="text-[#9E9E9E]">Ответственный:</span> <span className="font-medium">{detailShipment.responsible}</span></div>
                <div><span className="text-[#9E9E9E]">Итоговая сумма:</span> <span className="font-medium">{detailShipment.totalSum.toLocaleString()} ₽</span></div>
              </div>
              <div className="mb-4">
                <h4 className="text-[12px] font-semibold mb-2 font-mono">Состав отгрузки</h4>
                <table className="w-full border border-[#D4CFC8]">
                  <thead className="bg-[#EFEBE6]">
                    <tr>
                      <th className="px-3 py-2 text-[11px] font-semibold text-left">Продукт</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-right">Количество</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-right">Цена</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEBE6]">
                    {detailShipment.items.map((it: any, i: number) => (
                      <tr key={i} className="bg-white">
                        <td className="px-3 py-2 text-[12px]">{it.productName}</td>
                        <td className="px-3 py-2 text-[12px] text-right font-mono">{it.quantity} {it.unit}</td>
                        <td className="px-3 py-2 text-[12px] text-right font-mono">{it.price.toLocaleString()} ₽</td>
                        <td className="px-3 py-2 text-[12px] text-right font-mono">{it.total.toLocaleString()} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                {detailShipment.status === 'draft' && (
                  <button onClick={() => alert('Проведение отгрузок отключено для этой фазы (Read-Only).')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#5A8A6E] rounded hover:bg-[#4A7A5E]">
                    Отгрузить
                  </button>
                )}
                {detailShipment.status === 'draft' && (
                  <button onClick={() => alert('Отмена отгрузок отключена для этой фазы (Read-Only).')} className="h-8 px-4 text-[12px] font-medium text-white bg-[#C0563F] rounded hover:bg-[#A84835]">
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
          {shipments.length === 0 ? (
            <div className="text-center p-8 text-[13px] text-[#5E5E5E]">Нет отгрузок.</div>
          ) : (
            <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">№</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Дата</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Клиент</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Продукция</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-right border-b-2 border-[#2B2B2B]">Сумма</th><th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Ответственный</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th><th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]"></th>
            </tr></thead>
              <tbody className="divide-y divide-[#F6F5F2]">{shipments.map((sh) => (
                <tr key={sh.id} className={`h-12 hover:bg-[#EFEBE6] cursor-pointer ${detailId === sh.id ? 'bg-[#F6F5F2]' : 'bg-white'}`} onClick={() => setDetailId(detailId === sh.id ? null : sh.id)}>
                  <td className="px-4 text-[12px] font-mono text-[#5E5E5E]">{sh.id}</td><td className="px-4 text-[12px]">{sh.date}</td>
                  <td className="px-4 text-[12px] font-medium">{sh.customer}</td>
                  <td className="px-4 text-[12px]">{sh.items.length} поз.<br/><span className="text-[10px] text-[#9E9E9E]">{sh.items.map((it: any) => `${it.productName} ×${it.quantity}`).join(', ')}</span></td>
                  <td className="px-4 text-[12px] text-right font-mono">{sh.totalSum.toLocaleString()} ₽</td>
                  <td className="px-4 text-[12px] text-[#5E5E5E]">{sh.responsible}</td>
                  <td className="px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${sh.status === 'shipped' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : sh.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#C0563F]/15 text-[#C0563F]'}`}>{sh.status === 'shipped' ? 'Отгружено' : sh.status === 'draft' ? 'Черновик' : 'Отменено'}</span></td>
                  <td className="px-4 text-center">{sh.status === 'draft' && <button onClick={(e) => { e.stopPropagation(); alert('Проведение отгрузок отключено для этой фазы (Read-Only).'); }} className="text-[11px] text-[#5A8A6E] font-medium">Отгрузить</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
