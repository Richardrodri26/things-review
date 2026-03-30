// src/components/editor/editor-renderer.tsx
// Renderiza el output de EditorJS en modo read-only (sin cargar el editor)

import type { OutputData } from '@editorjs/editorjs'
import { cn } from '@/shared/utils'
import type {
  HeaderData,
  ParagraphData,
  ListData,
  QuoteData,
  CodeData,
  ImageData,
  ChecklistData,
} from '@/types/editor'

interface EditorRendererProps {
  data: OutputData
  className?: string
}

export function EditorRenderer({ data, className }: EditorRendererProps) {
  if (!data?.blocks || data.blocks.length === 0) return null

  return (
    <div className={cn('editor-renderer space-y-4', className)}>
      {data.blocks.map((block, index) => (
        <BlockRenderer key={block.id ?? index} block={block} />
      ))}
    </div>
  )
}

interface BlockRendererProps {
  block: OutputData['blocks'][number]
}

function BlockRenderer({ block }: BlockRendererProps) {
  const data = block.data as unknown

  switch (block.type) {
    case 'header': {
      const { text, level } = data as HeaderData
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const sizeClass = {
        1: 'text-3xl font-bold mt-10 mb-4 first:mt-0',
        2: 'text-2xl font-bold mt-8 mb-3 first:mt-0',
        3: 'text-xl font-semibold mt-6 mb-2 first:mt-0',
        4: 'text-lg font-semibold mt-4 mb-1.5 first:mt-0',
        5: 'text-base font-semibold mt-3 mb-1 first:mt-0',
        6: 'text-sm font-semibold mt-2 mb-1 uppercase tracking-wide text-muted-foreground first:mt-0',
      }[level] ?? 'text-xl font-semibold'
      return (
        <Tag
          className={cn(sizeClass, 'leading-tight text-foreground')}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
    }

    case 'paragraph': {
      const { text } = data as ParagraphData
      if (!text) return null
      return (
        <p
          className="text-[17px] leading-[1.75] text-foreground"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
    }

    case 'list': {
      const { style, items } = data as ListData
      if (style === 'ordered') {
        return (
          <ol className="list-decimal list-outside ml-6 space-y-1.5 text-[17px] leading-[1.75] text-foreground">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ol>
        )
      }
      return (
        <ul className="list-disc list-outside ml-6 space-y-1.5 text-[17px] leading-[1.75] text-foreground">
          {items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )
    }

    case 'quote': {
      const { text, caption } = data as QuoteData
      return (
        <blockquote className="border-l-[3px] border-primary/50 pl-5 py-1 my-6 space-y-2">
          <p
            className="text-lg italic text-foreground/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {caption && (
            <cite
              className="text-sm text-muted-foreground not-italic flex items-center gap-1.5 before:content-['—']"
              dangerouslySetInnerHTML={{ __html: caption }}
            />
          )}
        </blockquote>
      )
    }

    case 'code': {
      const { code } = data as CodeData
      return (
        <pre className="rounded-md bg-muted px-4 py-3 overflow-x-auto text-sm font-mono text-foreground">
          <code>{code}</code>
        </pre>
      )
    }

    case 'delimiter': {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="flex gap-2 text-muted-foreground">
            <span>&#8901;</span>
            <span>&#8901;</span>
            <span>&#8901;</span>
          </div>
        </div>
      )
    }

    case 'image': {
      const imageData = data as ImageData
      const url = imageData.file?.url ?? imageData.url
      if (!url) return null
      return (
        <figure className={cn('my-2', imageData.stretched && 'w-full')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={imageData.caption ?? ''}
            className={cn(
              'rounded-md max-w-full',
              imageData.withBorder && 'border border-border',
              imageData.withBackground && 'bg-muted p-2',
              imageData.stretched ? 'w-full' : 'mx-auto',
            )}
          />
          {imageData.caption && (
            <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
              {imageData.caption}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'checklist': {
      const { items } = data as ChecklistData
      return (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-0.5 size-4 shrink-0 rounded border flex items-center justify-center text-xs',
                  item.checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground',
                )}
              >
                {item.checked && '✓'}
              </span>
              <span
                className={cn(
                  'text-sm',
                  item.checked && 'line-through text-muted-foreground',
                )}
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </li>
          ))}
        </ul>
      )
    }

    case 'embed': {
      const embedData = data as { service: string; embed: string; caption?: string }
      if (!embedData.embed) return null
      return (
        <figure className="my-2">
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
            <iframe
              src={embedData.embed}
              title={embedData.caption ?? embedData.service}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
          {embedData.caption && (
            <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
              {embedData.caption}
            </figcaption>
          )}
        </figure>
      )
    }

    default:
      return null
  }
}
