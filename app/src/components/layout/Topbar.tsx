import { useEffect, useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { getActiveOrganizationId, setActiveOrganizationId } from '../../api/organization'
import { apiRequest } from '../../api/client'
import { type Organization } from '../../api/types'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState(getActiveOrganizationId())

  useEffect(() => {
    let active = true
    async function loadOrgs() {
      try {
        const res = await apiRequest<{ data: Organization[] }>('GET', '/api/organizations')
        if (active && res && res.data) {
          setOrgs(res.data)
        }
      } catch (err) {
        console.error('Failed to load organizations in topbar:', err)
      }
    }
    loadOrgs()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const syncOrg = () => {
      setActiveOrgId(getActiveOrganizationId())
    }
    window.addEventListener('organization-changed', syncOrg)
    return () => {
      window.removeEventListener('organization-changed', syncOrg)
    }
  }, [])

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setActiveOrgId(val)
    setActiveOrganizationId(val)
  }

  return (
    <header className="fixed top-0 left-[240px] right-0 h-14 bg-white border-b border-[#D4CFC8] flex items-center justify-between px-6 z-40">
      <h1 className="text-[18px] font-semibold text-[#2B2B2B]">{title}</h1>

      <div className="flex items-center gap-4">
        {orgs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#5E5E5E]">Организация:</span>
            <select
              value={activeOrgId}
              onChange={handleOrgChange}
              className="h-8 px-2 text-[12px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F] focus:ring-1 focus:ring-[#C0563F]/20"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
          <input
            type="text"
            placeholder="Поиск..."
            className="h-8 w-56 pl-9 pr-3 text-[13px] bg-[#F6F5F2] border border-[#D4CFC8] rounded focus:outline-none focus:border-[#C0563F] focus:ring-2 focus:ring-[#C0563F]/20"
          />
        </div>

        <button className="relative p-2 text-[#5E5E5E] hover:text-[#2B2B2B] transition-colors">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#C0563F] rounded-full" />
        </button>
      </div>
    </header>
  )
}
