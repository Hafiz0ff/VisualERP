import { useState } from 'react'
import {
  LayoutDashboard, Warehouse, Factory, ArrowRightLeft,
  FlaskConical, PackageCheck, BarChart3,
  Truck, FileMinus, ScrollText, LogIn, ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Dashboard from './pages/Dashboard'
import RawMaterials from './pages/RawMaterials'
import IncomingMaterials from './pages/IncomingMaterials'
import Workshop from './pages/Workshop'
import Transfers from './pages/Transfers'
import Production from './pages/Production'
import Recipes from './pages/Recipes'
import Products from './pages/Products'
import Shipments from './pages/Shipments'
import WriteOffs from './pages/WriteOffs'
import Reports from './pages/Reports'
import AuditLog from './pages/AuditLog'
import InventoryAudits from './pages/InventoryAudits'

const navItems = [
  { key: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { key: 'raw-materials', label: 'Склад сырья', icon: Warehouse },
  { key: 'incoming', label: 'Приход сырья', icon: LogIn },
  { key: 'workshop', label: 'Цех', icon: Factory },
  { key: 'transfers', label: 'Передачи', icon: ArrowRightLeft },
  { key: 'production', label: 'Производство', icon: FlaskConical },
  { key: 'recipes', label: 'Рецептуры', icon: PackageCheck },
  { key: 'products', label: 'Готовая продукция', icon: PackageCheck },
  { key: 'shipments', label: 'Отгрузки', icon: Truck },
  { key: 'writeoffs', label: 'Списания', icon: FileMinus },
  { key: 'audits', label: 'Инвентаризация', icon: ClipboardCheck },
  { key: 'reports', label: 'Отчеты', icon: BarChart3 },
  { key: 'auditlog', label: 'Журнал операций', icon: ScrollText },
]

export default function App() {
  const [page, setPage] = useState('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'raw-materials': return <RawMaterials />
      case 'incoming': return <IncomingMaterials />
      case 'workshop': return <Workshop />
      case 'transfers': return <Transfers />
      case 'production': return <Production />
      case 'recipes': return <Recipes />
      case 'products': return <Products />
      case 'shipments': return <Shipments />
      case 'writeoffs': return <WriteOffs />
      case 'reports': return <Reports />
      case 'auditlog': return <AuditLog />
      case 'audits': return <InventoryAudits />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2]">
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#D4CFC8] flex flex-col z-50">
        <div className="h-14 flex items-center px-4 border-b border-[#D4CFC8]">
          <span className="text-[14px] font-bold tracking-wide text-[#2B2B2B] uppercase">ПромСтройСмеси</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={cn(
                'w-full flex items-center gap-3 h-9 px-4 mx-2 text-[12px] font-medium transition-colors',
                page === item.key ? 'bg-[#F6F5F2] text-[#C0563F] border-l-[3px] border-l-[#C0563F]' : 'text-[#5E5E5E] hover:bg-[#F6F5F2] hover:text-[#2B2B2B]'
              )}
            >
              <item.icon size={16} strokeWidth={2} />
              <span className="text-left">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#D4CFC8]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#C0563F] flex items-center justify-center text-white text-[11px] font-bold">А</div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-[#2B2B2B]">Администратор</span>
              <span className="text-[10px] text-[#9E9E9E]">admin@promstroy.ru</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="ml-[240px]">
        {renderPage()}
      </main>
    </div>
  )
}
