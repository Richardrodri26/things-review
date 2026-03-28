// entities/book/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Book extends ReviewableItem {
  contentType: 'book'
  author: string[]
  isbn?: string
  pageCount?: number
  publisher?: string
  language: string
}
