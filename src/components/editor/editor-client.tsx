'use client'

// src/components/editor/editor-client.tsx
import { useEffect, useRef, useState } from 'react'
import type { OutputData } from '@editorjs/editorjs'
import type EditorJSType from '@editorjs/editorjs'
import { EDITOR_JS_TOOLS } from './editor-tools'
import { cn } from '@/shared/utils'

let EditorJS: typeof EditorJSType | null = null

interface EditorClientProps {
  defaultValue?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  /** Modo compacto para formularios (con borde). Default: false */
  compact?: boolean
}

export function EditorClient({
  defaultValue,
  onChange,
  placeholder = 'Start writing your review...',
  readOnly = false,
  className = '',
  compact = false,
}: EditorClientProps) {
  const editorRef = useRef<EditorJSType | null>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const onChangeRef = useRef(onChange)

  // Mantener ref de onChange actualizada sin re-inicializar el editor
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Solo renderizar en cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Inicializar EditorJS
  useEffect(() => {
    if (!isMounted || !holderRef.current) return

    const initEditor = async () => {
      if (!EditorJS) {
        const module = await import('@editorjs/editorjs')
        EditorJS = module.default
      }

      if (!holderRef.current || editorRef.current) return

      const editor = new EditorJS({
        holder: holderRef.current,
        placeholder,
        readOnly,
        data: defaultValue ?? { time: Date.now(), blocks: [] },
        onChange: async () => {
          if (onChangeRef.current && editorRef.current) {
            try {
              const data = await editorRef.current.save()
              onChangeRef.current(data)
            } catch (error) {
              console.error('Error saving editor data:', error)
            }
          }
        },
        tools: EDITOR_JS_TOOLS,
        autofocus: false,
        inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode'],
      })

      editorRef.current = editor

      try {
        await editor.isReady
        setIsReady(true)
      } catch (error) {
        console.error('Editor ready error:', error)
      }
    }

    initEditor()

    return () => {
      const editor = editorRef.current
      if (editor) {
        editorRef.current = null
        setIsReady(false)
        try {
          editor.destroy()
        } catch {
          // silently ignore — may already be destroyed
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, placeholder, readOnly])

  // Re-render datos solo cuando cambian externamente (no en cada onChange)
  const prevDataRef = useRef<OutputData | undefined>(defaultValue)
  useEffect(() => {
    if (isReady && editorRef.current && defaultValue && defaultValue !== prevDataRef.current) {
      prevDataRef.current = defaultValue
      editorRef.current.render(defaultValue).catch((e: unknown) => console.error(e))
    }
  }, [isReady, defaultValue])

  // Loading skeleton
  if (!isMounted) {
    return (
      <div className={cn('animate-pulse space-y-3 py-2', className)}>
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'editor-client-wrapper relative w-full',
        compact && 'min-h-[160px]',
        className,
      )}
    >
      <div
        ref={holderRef}
        className="editor-content w-full"
      />
    </div>
  )
}

// Helper para extraer texto plano del output de EditorJS
export function extractPlainText(data: OutputData): string {
  if (!data.blocks) return ''

  return data.blocks
    .map((block) => {
      const blockData = block.data as Record<string, unknown>
      switch (block.type) {
        case 'paragraph':
        case 'header':
          return (blockData.text as string)?.replace(/<[^>]*>/g, '') ?? ''
        case 'list':
          return (blockData.items as string[])
            .map((i) => (typeof i === 'string' ? i.replace(/<[^>]*>/g, '') : ''))
            .join('\n')
        case 'quote':
          return `${(blockData.text as string)?.replace(/<[^>]*>/g, '') ?? ''}${blockData.caption ? `\n— ${blockData.caption}` : ''}`
        case 'code':
          return blockData.code as string
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

// Helper para verificar si el editor tiene contenido
export function isEditorEmpty(data?: OutputData): boolean {
  if (!data?.blocks || data.blocks.length === 0) return true
  return data.blocks.every((block) => {
    const blockData = block.data as Record<string, unknown>
    if (block.type === 'paragraph') {
      const text = blockData.text as string
      return !text || text.replace(/<[^>]*>/g, '').trim() === ''
    }
    return false
  })
}
