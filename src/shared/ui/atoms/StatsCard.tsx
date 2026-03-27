// src/shared/ui/atoms/StatsCard.tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 flex flex-col gap-1',
      className
    )}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <span className="size-4">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
