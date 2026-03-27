'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/AppHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useInitDevUser } from '@/shared/hooks/useInitDevUser'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitDevUser()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
