'use client'

import * as React from 'react'
import {
  FilmIcon,
  TvIcon,
  StarIcon,
  UsersIcon,
  UserCircleIcon,
  BookmarkIcon,
} from 'lucide-react'

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

const navItems = [
  { title: 'Movies',    url: ROUTES.MOVIES,    icon: <FilmIcon /> },
  { title: 'Series',    url: ROUTES.SERIES,    icon: <TvIcon /> },
  { title: 'Reviews',   url: ROUTES.REVIEWS,   icon: <StarIcon /> },
  { title: 'Watchlist', url: ROUTES.WATCHLIST, icon: <BookmarkIcon /> },
  { title: 'Groups',    url: ROUTES.GROUPS,    icon: <UsersIcon /> },
  { title: 'Profile',   url: ROUTES.PROFILE,   icon: <UserCircleIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <span className="truncate font-semibold text-sm">Things Review</span>
                <span className="truncate text-xs text-muted-foreground">Your reviews, together</span>
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
