'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/AppHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuthGuard } from '@/shared/hooks'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isReady = useAuthGuard()

  if (!isReady) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 w-auto overflow-x-hidden">
        <AppHeader />
        <main className="flex flex-1 flex-col min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
