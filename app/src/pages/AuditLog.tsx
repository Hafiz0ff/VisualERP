import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { AlertTriangle, Search } from 'lucide-react'

const actionColors: Record<string, string> = {
  'CREATE': 'bg-[#2A5C8D]/10 text-[#2A5C8D]',
  'SHIP': 'bg-[#5A8A6E]/10 text-[#5A8A6E]',
  'CANCEL': 'bg-[#C0563F]/10 text-[#C0563F]',
  'POST': 'bg-[#5A8A6E]/10 text-[#5A8A6E]',
  'UPDATE': 'bg-[#F0A830]/10 text-[#F0A830]',
  'COUNT': 'bg-[#2A5C8D]/10 text-[#2A5C8D]',
  'APPROVE': 'bg-[#5A8A6E]/10 text-[#5A8A6E]',
}

const docColors: Record<string, string> = {
  'PurchaseReceipt': 'bg-[#5A8A6E]/15 text-[#5A8A6E]',
  'Transfer': 'bg-[#2A5C8D]/15 text-[#2A5C8D]',
  'ProductionOrder': 'bg-[#F0A830]/15 text-[#F0A830]',
  'Shipment': 'bg-[#C0563F]/15 text-[#C0563F]',
  'WriteOff': 'bg-[#9E9E9E]/15 text-[#9E9E9E]',
  'InventoryAudit': 'bg-[#2B2B2B]/15 text-[#2B2B2B]',
}

const docTypeLabels: Record<string, string> = {
  'PurchaseReceipt': 'Приход',
  'Transfer': 'Передача',
  'ProductionOrder': 'Производство',
  'Shipment': 'Отгрузка',
  'WriteOff': 'Списание',
  'InventoryAudit': 'Инвентаризация',
}

interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userEmail: string | null
  userFullName: string | null
  action: string
  entityType: string
  entityId: string
  summary: string
}

export default function AuditLog() {
  const { data: dashboardRes, loading, error, refetch } = useApiQuery<{ recentAuditEvents: AuditEvent[] }>('/api/dashboard')
  const [search, setSearch] = useState('')
  const [docFilter, setDocFilter] = useState('all')

  const rawEvents = dashboardRes?.recentAuditEvents || []

  const mappedEvents = rawEvents.map((e) => ({
    id: e.id,
    timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString() : '',
    user: e.userFullName || e.userEmail || 'Система',
    action: e.action,
    documentType: e.entityType,
    documentId: e.entityId,
    object: e.summary,
    oldValue: '',
    newValue: '',
    status: 'Успешно',
  }))

  const filtered = mappedEvents.filter((e) => {
    const searchLower = search.toLowerCase()
    const ms =
      e.action.toLowerCase().includes(searchLower) ||
      e.object.toLowerCase().includes(searchLower) ||
      e.user.toLowerCase().includes(searchLower) ||
      e.documentId.toLowerCase().includes(searchLower)
    
    return ms && (docFilter === 'all' || e.documentType === docFilter)
  })

  if (loading) {
    return (
      <Layout title="Журнал операций">
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
      <Layout title="Журнал операций">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить журнал операций</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={refetch} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Журнал операций">
      <div className="bg-white border border-[#D4CFC8] p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
          <input type="text" placeholder="Поиск по действию, объекту, пользователю..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-9 pr-3 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F]" />
        </div>
        <select value={docFilter} onChange={(e) => setDocFilter(e.target.value)} className="h-9 px-3 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded">
          <option value="all">Все типы</option>
          <option value="PurchaseReceipt">Приход</option>
          <option value="Transfer">Передача</option>
          <option value="ProductionOrder">Производство</option>
          <option value="Shipment">Отгрузка</option>
          <option value="WriteOff">Списание</option>
          <option value="InventoryAudit">Инвентаризация</option>
        </select>
        <span className="text-[12px] text-[#5E5E5E] ml-auto">Записей: <strong>{filtered.length}</strong></span>
      </div>

      <div className="bg-white border border-[#D4CFC8]">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center p-8 text-[13px] text-[#5E5E5E]">Записи журнала отсутствуют.</div>
          ) : (
            <table className="w-full"><thead><tr className="bg-[#EFEBE6]">
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Время</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Пользователь</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Действие</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Тип док.</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Документ</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-left border-b-2 border-[#2B2B2B]">Сводка по операции</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-center border-b-2 border-[#2B2B2B]">Статус</th>
            </tr></thead>
              <tbody className="divide-y divide-[#F6F5F2]">{filtered.map((e, idx) => (
                <tr key={e.id} className={`h-12 ${idx % 2 === 1 ? 'bg-[#F6F5F2]' : 'bg-white'} hover:bg-[#EFEBE6]`}>
                  <td className="px-4 text-[11px] font-mono text-[#5E5E5E] whitespace-nowrap">{e.timestamp}</td>
                  <td className="px-4 text-[12px] font-medium text-[#2B2B2B]">{e.user}</td>
                  <td className="px-4"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${actionColors[e.action] || 'bg-[#9E9E9E]/10 text-[#9E9E9E]'}`}>{e.action}</span></td>
                  <td className="px-4"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${docColors[e.documentType] || 'bg-[#9E9E9E]/10 text-[#9E9E9E]'}`}>{docTypeLabels[e.documentType] || e.documentType}</span></td>
                  <td className="px-4 text-[11px] font-mono text-[#5E5E5E]">{e.documentId}</td>
                  <td className="px-4 text-[12px] text-[#2B2B2B]">{e.object}</td>
                  <td className="px-4 text-center"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${e.status === 'Успешно' ? 'bg-[#5A8A6E]/10 text-[#5A8A6E]' : 'bg-[#F0A830]/10 text-[#F0A830]'}`}>{e.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
