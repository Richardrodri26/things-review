'use client'

import { useState, useCallback } from 'react'
import { getFromStorage, setToStorage } from '@/shared/services/localStorage.service'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() =>
    getFromStorage<T>(key, initialValue)
  )

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
      setToStorage(key, next)
      return next
    })
  }, [key])

  return [storedValue, setValue] as const
}
