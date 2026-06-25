import { cn } from '@/lib/utils'

type StatusVariant = 'ok' | 'low' | 'critical' | 'pending' | 'completed' | 'in_progress' | 'planned' | 'cancelled'

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  ok: { label: 'Норма', className: 'bg-[#5A8A6E]/15 text-[#5A8A6E]' },
  low: { label: 'Низкий', className: 'bg-[#F0A830]/15 text-[#F0A830]' },
  critical: { label: 'Критично', className: 'bg-[#C0563F]/15 text-[#C0563F]' },
  pending: { label: 'Ожидает', className: 'bg-[#F0A830]/15 text-[#F0A830]' },
  completed: { label: 'Выполнено', className: 'bg-[#5A8A6E]/15 text-[#5A8A6E]' },
  in_progress: { label: 'В работе', className: 'bg-[#2A5C8D]/15 text-[#2A5C8D]' },
  planned: { label: 'План', className: 'bg-[#9E9E9E]/15 text-[#9E9E9E]' },
  cancelled: { label: 'Отменён', className: 'bg-[#C0563F]/15 text-[#C0563F]' },
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ok

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
