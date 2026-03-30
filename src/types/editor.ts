// src/types/editor.ts
// Tipos TypeScript para EditorJS

import type { OutputData, API, BlockAPI } from '@editorjs/editorjs'

// Re-export EditorJS types
export type { OutputData, API, BlockAPI }

// Estructura de salida de EditorJS
export interface EditorOutput extends OutputData {
  time: number
  version: string
  blocks: EditorBlock[]
}

export interface EditorBlock {
  id: string
  type: string
  data: Record<string, unknown>
}

// Tipos para tools específicos
export interface HeaderData {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ParagraphData {
  text: string
}

export interface ListData {
  style: 'ordered' | 'unordered'
  items: string[]
}

export interface QuoteData {
  text: string
  caption?: string
  alignment?: 'left' | 'center'
}

export interface CodeData {
  code: string
}

export interface ImageData {
  file?: {
    url: string
  }
  url?: string
  caption?: string
  stretched?: boolean
  withBorder?: boolean
  withBackground?: boolean
}

export interface ChecklistData {
  items: Array<{
    text: string
    checked: boolean
  }>
}

// Props para el componente EditorClient
export interface EditorClientProps {
  defaultValue?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

// Props para el componente EditorRenderer
export interface EditorRendererProps {
  data: OutputData
  className?: string
}
