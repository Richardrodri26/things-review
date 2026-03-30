'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setLocale } from '@/i18n/actions'
import { locales, type Locale } from '@/i18n/config'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

export function LanguageSelector() {
  const locale = useLocale() as Locale
  const t = useTranslations('language')
  const [isPending, startTransition] = useTransition()

  function handleLocaleChange(next: Locale) {
    if (next === locale) return
    startTransition(async () => {
      await setLocale(next)
      window.location.reload()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isPending}
            aria-label={t('toggle')}
          />
        }
      >
        <LanguagesIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={l === locale ? 'font-medium text-primary' : ''}
          >
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
