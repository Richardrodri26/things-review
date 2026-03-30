'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ROUTES } from '@/shared/constants'
import { ThemeToggle } from '@/components/ThemeToggle'

const routeLabels: Record<string, string> = {
  [ROUTES.MOVIES]:  'Movies',
  [ROUTES.SERIES]:  'Series',
  [ROUTES.REVIEWS]: 'My Reviews',
  [ROUTES.GROUPS]:  'Groups',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.HOME]:    'Home',
}

export function AppHeader() {
  const pathname = usePathname()
  const label = routeLabels[pathname] ?? 'Things Review'
  const isHome = pathname === ROUTES.HOME

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 data-vertical:h-4 data-vertical:self-auto" />
      <Breadcrumb>
        <BreadcrumbList>
          {!isHome && (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={ROUTES.HOME}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
