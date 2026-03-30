'use client'

import * as React from 'react'
import {
  HomeIcon,
  FilmIcon,
  TvIcon,
  StarIcon,
  UsersIcon,
  UserCircleIcon,
  BookmarkIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ROUTES } from '@/shared/constants'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations()

  const navItems = [
    { title: t('nav.home'),      url: ROUTES.HOME,      icon: <HomeIcon />,       exact: true },
    { title: t('nav.movies'),    url: ROUTES.MOVIES,    icon: <FilmIcon /> },
    { title: t('nav.series'),    url: ROUTES.SERIES,    icon: <TvIcon /> },
    { title: t('nav.reviews'),   url: ROUTES.REVIEWS,   icon: <StarIcon /> },
    { title: t('nav.watchlist'), url: ROUTES.WATCHLIST, icon: <BookmarkIcon /> },
    { title: t('nav.groups'),    url: ROUTES.GROUPS,    icon: <UsersIcon /> },
    { title: t('nav.profile'),   url: ROUTES.PROFILE,   icon: <UserCircleIcon /> },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href={ROUTES.HOME} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                TR
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-semibold text-sm">{t('app.name')}</span>
                <span className="truncate text-xs text-muted-foreground">{t('app.tagline')}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
