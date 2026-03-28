// src/features/catalog/components/AddContentDialog.tsx
'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AddContentForm } from './AddContentForm'
import type { ContentType } from '@/shared/types'

interface AddContentDialogProps {
  defaultContentType?: ContentType
}

export function AddContentDialog({ defaultContentType }: AddContentDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        Add manually
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Catalog</DialogTitle>
            <DialogDescription>
              Add a movie, series, game, book, album or podcast manually.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <AddContentForm
              defaultContentType={defaultContentType}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
