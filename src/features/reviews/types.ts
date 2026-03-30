// src/features/reviews/types.ts
import type { Review } from '@/entities/review/types'
import type { OutputData } from '@editorjs/editorjs'
import type { Rating } from '@/shared/types'

// Para el formulario — campos editables
export interface ReviewFormValues {
  contentId: string
  contentType: 'movie' | 'series' | 'music' | 'game' | 'book' | 'podcast'
  rating?: Rating
  title?: string
  body?: OutputData
  containsSpoilers: boolean
  status: 'consumed' | 'want_to_consume' | 'consuming' | 'dropped'
}

// Modo del formulario
export type ReviewFormMode = 'create' | 'edit'

// Props del componente
export interface ReviewFormProps {
  mode: ReviewFormMode
  initialValues?: Partial<ReviewFormValues>
  review?: Review  // solo en modo edit
  onSuccess?: (review: Review) => void
  onCancel?: () => void
}
