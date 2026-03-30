// src/components/editor/editor-tools.ts
// Configuración de tools para EditorJS

// eslint-disable-next-line @typescript-eslint/no-require-imports
import Header from '@editorjs/header'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import List from '@editorjs/list'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Quote from '@editorjs/quote'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Code from '@editorjs/code'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Delimiter from '@editorjs/delimiter'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import InlineCode from '@editorjs/inline-code'

// Estos paquetes no tienen tipos — usamos require para evitar el error TS7016
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Checklist = require('@editorjs/checklist') as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Marker = require('@editorjs/marker') as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Embed = require('@editorjs/embed') as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Image = require('@editorjs/image') as any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EDITOR_JS_TOOLS: Record<string, any> = {
  // Headers (H1, H2, H3, H4)
  header: {
    class: Header,
    inlineToolbar: true,
    config: {
      placeholder: 'Heading...',
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
    },
  },

  // Listas (ordered y unordered)
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered',
    },
  },

  // Citas / blockquotes
  quote: {
    class: Quote,
    inlineToolbar: true,
  },

  // Código
  code: {
    class: Code,
    inlineToolbar: false,
  },

  // Checklist / tareas
  checklist: {
    class: Checklist,
    inlineToolbar: false,
  },

  // Marcador (highlight)
  marker: {
    class: Marker,
    inlineToolbar: false,
  },

  // Código inline
  inlineCode: {
    class: InlineCode,
    inlineToolbar: true,
  },

  // Separador visual
  delimiter: Delimiter,

  // Embeds (YouTube, Twitter, etc.)
  embed: {
    class: Embed,
    inlineToolbar: false,
    config: {
      services: {
        youtube: true,
        twitter: true,
        codepen: true,
        github: true,
      },
    },
  },

  // Imágenes (solo URL, sin backend de upload)
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByFile: async (file: File) => {
          const url = URL.createObjectURL(file)
          return {
            success: 1,
            file: { url, name: file.name, size: file.size },
          }
        },
        uploadByUrl: async (url: string) => {
          return { success: 1, file: { url } }
        },
      },
    },
  },
}

export const INLINE_TOOLS = ['bold', 'italic', 'underline', 'link'] as const
