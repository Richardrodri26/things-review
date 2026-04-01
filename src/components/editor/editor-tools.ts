// src/components/editor/editor-tools.ts
// Configuración de tools para EditorJS

import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import InlineCode from '@editorjs/inline-code'
// @ts-expect-error — @editorjs/checklist no tiene tipos declarados válidos
import Checklist from '@editorjs/checklist'
// @ts-expect-error — @editorjs/marker no tiene tipos declarados válidos
import Marker from '@editorjs/marker'
// @ts-expect-error — @editorjs/embed no tiene tipos declarados
import Embed from '@editorjs/embed'
import Image from '@editorjs/image'

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
