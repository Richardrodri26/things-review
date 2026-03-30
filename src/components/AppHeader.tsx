'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { LanguageSelector } from '@/components/LanguageSelector'

export function AppHeader() {
  const pathname = usePathname()
  const t = useTranslations()

  const routeLabels: Record<string, string> = {
    [ROUTES.MOVIES]:  t('nav.movies'),
    [ROUTES.SERIES]:  t('nav.series'),
    [ROUTES.REVIEWS]: t('nav.reviews'),
    [ROUTES.GROUPS]:  t('nav.groups'),
    [ROUTES.PROFILE]: t('nav.profile'),
    [ROUTES.HOME]:    t('nav.home'),
  }

  const label = routeLabels[pathname] ?? t('app.name')
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
                <BreadcrumbLink href={ROUTES.HOME}>{t('nav.home')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex items-center gap-1">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  )
}
