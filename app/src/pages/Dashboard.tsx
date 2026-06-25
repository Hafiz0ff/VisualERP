import { Layout } from '@/components/layout/Layout'
import { useApiQuery } from '../hooks/useApiQuery'
import { mapDashboardStats } from '../api/mappers/dashboard.mapper'
import type { DashboardResponse } from '../api/types'
import { Warehouse, Factory, PackageCheck, AlertTriangle, TrendingUp, ArrowRightLeft, FlaskConical, LogIn, Truck, FileMinus, Clock, ClipboardList } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const monthlyData = [
  { day: '01', income: 180, expense: 120 }, { day: '05', income: 190, expense: 130 },
  { day: '09', income: 310, expense: 200 }, { day: '13', income: 340, expense: 220 },
  { day: '17', income: 380, expense: 250 }, { day: '21', income: 420, expense: 280 },
  { day: '25', income: 450, expense: 300 },
]

const rawMaterialDist = [
  { name: 'Вяжущие', value: 35, color: '#C0563F' }, { name: 'Заполнители', value: 30, color: '#2A5C8D' },
  { name: 'Добавки', value: 20, color: '#5A8A6E' }, { name: 'Упаковка', value: 10, color: '#F0A830' },
  { name: 'Пигменты', value: 5, color: '#9E9E9E' },
]

export default function Dashboard() {
  const { data: dashboardResponse, loading, error, refetch } = useApiQuery<{ data: DashboardResponse }>('/api/dashboard')
  const dashboardData = dashboardResponse?.data || null
  
  const s = mapDashboardStats(dashboardData)
  const lowStock = dashboardData?.lowStockItems || []

  const recentOps = (dashboardData?.recentAuditEvents || []).map((event) => {
    // Map AuditLogItem to recentOps shape
    const lowerType = event.entityType.toLowerCase();
    const mappedType = lowerType.includes('production')
      ? ('production' as const)
      : lowerType.includes('transfer')
      ? ('transfer' as const)
      : lowerType.includes('receipt') || lowerType.includes('incoming')
      ? ('incoming' as const)
      : ('shipment' as const);

    const actionLower = event.action.toLowerCase();
    const status = actionLower.includes('cancel')
      ? 'cancelled'
      : actionLower.includes('post') || actionLower.includes('ship') || actionLower.includes('complete')
      ? 'posted'
      : 'draft';

    return {
      id: event.entityId,
      type: mappedType,
      productName: event.summary,
      date: new Date(event.timestamp).toLocaleDateString(),
      status,
    };
  })

  if (loading) {
    return (
      <Layout title="Главная">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#D4CFC8] p-4 relative overflow-hidden animate-pulse h-24">
              <div className="h-3 bg-[#EFEBE6] w-1/2 mb-3 rounded" />
              <div className="h-6 bg-[#EFEBE6] w-3/4 rounded" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white border border-[#D4CFC8] mb-4 animate-pulse rounded p-4 flex items-center justify-center">
          <span className="text-[12px] text-[#9E9E9E]">Загрузка графиков...</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-white border border-[#D4CFC8] animate-pulse rounded" />
          <div className="h-48 bg-white border border-[#D4CFC8] animate-pulse rounded" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Главная">
        <div className="bg-white border border-red-200 p-6 text-center my-8 rounded">
          <AlertTriangle className="mx-auto text-red-500 mb-3" size={24} />
          <h3 className="text-red-600 font-semibold text-[14px] mb-2">Не удалось загрузить сводку приборной панели</h3>
          <p className="text-[12px] text-[#5E5E5E] mb-4">Проверьте подключение к API или перезагрузите страницу.</p>
          <button onClick={() => refetch()} className="h-9 px-4 bg-[#C0563F] text-white text-[12px] font-medium rounded hover:bg-[#A84835]">Повторить попытку</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Главная">
      {/* Row 1: Main metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { icon: Warehouse, color: '#C0563F', val: s.rawMaterialsTotal, label: 'Сырьё на складе', sub: 'позиций' },
          { icon: Factory, color: '#2A5C8D', val: s.rawMaterialsInWorkshop, label: 'Сырьё в цехе', sub: 'не настроено' },
          { icon: PackageCheck, color: '#5A8A6E', val: s.finishedProductsTotal, label: 'Готовая продукция', sub: 'мешков на складе' },
          { icon: AlertTriangle, color: '#F0A830', val: s.lowStockCount, label: 'Ниже мин. остатка', sub: 'позиций', alert: true },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-[#D4CFC8] p-4 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: c.color }} />
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 bg-[#F6F5F2] rounded"><c.icon size={18} style={{ color: c.color }} strokeWidth={2} /></div>
              <span className="text-[10px] text-[#9E9E9E] font-medium">{c.sub}</span>
            </div>
            <div className={`text-[26px] font-bold leading-tight ${c.alert ? 'text-[#C0563F]' : 'text-[#2B2B2B]'}`}>{c.val === null ? '—' : c.val.toLocaleString()}</div>
            <div className="text-[11px] text-[#5E5E5E] mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Secondary metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { icon: TrendingUp, color: '#C0563F', val: s.producedMonth, label: 'Выпущено за месяц', sub: 'мешков' },
          { icon: LogIn, color: '#2A5C8D', val: s.incomingMonth, label: 'Приходы за месяц', sub: 'нет данных' },
          { icon: Truck, color: '#5A8A6E', val: s.shippedMonth, label: 'Отгрузок за месяц', sub: 'док.' },
          { icon: FileMinus, color: '#9E9E9E', val: s.writeOffMonth, label: 'Списания за месяц', sub: 'кг/т/шт' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-[#D4CFC8] p-4 flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: `${c.color}15` }}><c.icon size={16} style={{ color: c.color }} strokeWidth={2} /></div>
            <div>
              <div className="text-[18px] font-bold text-[#2B2B2B]">{c.val === null ? '—' : c.val.toLocaleString()}</div>
              <div className="text-[10px] text-[#5E5E5E]">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Activity metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { icon: FlaskConical, color: '#2A5C8D', val: s.activeProd, label: 'Активных производств' },
          { icon: ClipboardList, color: '#F0A830', val: s.pendingDocs, label: 'Ожидают документы' },
          { icon: PackageCheck, color: '#5A8A6E', val: s.producedToday, label: 'Выпущено сегодня, меш.' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-[#D4CFC8] p-3 flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: `${c.color}15` }}><c.icon size={16} style={{ color: c.color }} /></div>
            <div><div className="text-[18px] font-bold">{c.val}</div><div className="text-[10px] text-[#5E5E5E]">{c.label}</div></div>
          </div>
        ))}
      </div>

      {/* Row 4: Charts */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-white border border-[#D4CFC8] p-4">
          <h3 className="text-[13px] font-semibold mb-3">Доходы и расходы (июнь 2024)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ci" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C0563F" stopOpacity={0.15} /><stop offset="95%" stopColor="#C0563F" stopOpacity={0} /></linearGradient>
                <linearGradient id="ce" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2A5C8D" stopOpacity={0.15} /><stop offset="95%" stopColor="#2A5C8D" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFEBE6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={{ stroke: '#D4CFC8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={{ stroke: '#D4CFC8' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D4CFC8', borderRadius: '4px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="income" stroke="#C0563F" strokeWidth={2} fill="url(#ci)" name="Доход" />
              <Area type="monotone" dataKey="expense" stroke="#2A5C8D" strokeWidth={2} fill="url(#ce)" name="Расход" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-[#D4CFC8] p-4">
          <h3 className="text-[13px] font-semibold mb-3">Распределение сырья</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={rawMaterialDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                {rawMaterialDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D4CFC8', borderRadius: '4px', fontSize: '11px' }} formatter={(value: number) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Lists */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#D4CFC8]">
          <div className="px-4 py-2.5 border-b border-[#D4CFC8] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Сырьё ниже мин. остатка</h3>
            <span className="text-[10px] text-[#C0563F] font-medium">{lowStock.length} поз.</span>
          </div>
          <div className="divide-y divide-[#EFEBE6]">
            <div className="px-4 py-8 text-center text-[12px] text-[#9E9E9E]">
              Минимальные остатки пока не заведены в модели данных.
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#D4CFC8]">
          <div className="px-4 py-2.5 border-b border-[#D4CFC8] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Последние операции</h3>
            <Clock size={13} className="text-[#9E9E9E]" />
          </div>
          <div className="divide-y divide-[#EFEBE6] max-h-[280px] overflow-y-auto">
            {recentOps.map((op) => (
              <div key={`${op.type}-${op.id}`} className="px-4 py-2 flex items-center justify-between hover:bg-[#F6F5F2]">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${op.type === 'production' ? 'bg-[#2A5C8D]/10' : op.type === 'transfer' ? 'bg-[#F0A830]/10' : op.type === 'incoming' ? 'bg-[#5A8A6E]/10' : 'bg-[#C0563F]/10'}`}>
                    {op.type === 'production' ? <FlaskConical size={12} className="text-[#2A5C8D]" /> : op.type === 'transfer' ? <ArrowRightLeft size={12} className="text-[#F0A830]" /> : op.type === 'incoming' ? <LogIn size={12} className="text-[#5A8A6E]" /> : <Truck size={12} className="text-[#C0563F]" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-[#5E5E5E]">{op.id}</div>
                    <div className="text-[10px] text-[#9E9E9E]">{op.productName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#5E5E5E]">{op.date}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${op.status === 'completed' || op.status === 'posted' || op.status === 'shipped' ? 'bg-[#5A8A6E]/15 text-[#5A8A6E]' : op.status === 'in_progress' ? 'bg-[#2A5C8D]/15 text-[#2A5C8D]' : op.status === 'planned' || op.status === 'pending' || op.status === 'draft' ? 'bg-[#F0A830]/15 text-[#F0A830]' : 'bg-[#9E9E9E]/15 text-[#9E9E9E]'}`}>
                    {op.status === 'completed' || op.status === 'posted' || op.status === 'shipped' ? 'Выполнено' : op.status === 'in_progress' ? 'В работе' : op.status === 'planned' ? 'План' : op.status === 'pending' ? 'Ожидает' : op.status === 'draft' ? 'Черновик' : op.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
