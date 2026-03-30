'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    exact?: boolean
  }[]
}) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('navigation')}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.url
            : pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link href={item.url} />}
                isActive={isActive}
                tooltip={item.title}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
