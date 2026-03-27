'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useInitDevUser } from '@/shared/hooks/useInitDevUser'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitDevUser()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
