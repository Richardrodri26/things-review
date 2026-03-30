'use client'

// src/features/comments/components/CommentCard.tsx

import { useState } from 'react'
import { PencilIcon, TrashIcon, CheckIcon, XIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/shared/utils'
import { useUpdateComment, useDeleteComment } from '../hooks/useComments'
import { useUser } from '@/shared/lib/store'
import { ReplyForm } from './ReplyForm'
import type { Comment } from '@/entities/comment/types'

interface CommentCardProps {
  comment: Comment
  isOwn?: boolean
  /**
   * Replies directas de este comentario (solo aplica a comentarios raíz, depth === 0).
   * Para hilos infinitos, `replies` sería `CommentThread[]` y se renderizaría recursivamente.
   * Ver docs/plans/2026-03-30-comment-replies.md para la guía de escalado.
   */
  replies?: Comment[]
  /**
   * Profundidad actual del comentario. 0 = raíz, 1 = reply.
   * El botón "Reply" solo aparece en depth === 0 (1 nivel de profundidad).
   */
  depth?: number
  reviewId: string
  groupId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CommentCard({
  comment,
  isOwn = false,
  replies = [],
  depth = 0,
  reviewId,
  groupId,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const currentUser = useUser()

  const updateComment = useUpdateComment(comment.reviewId)
  const deleteComment = useDeleteComment(comment.reviewId)

  const handleSave = async () => {
    if (!editBody.trim()) return
    await updateComment.mutateAsync({ id: comment.id, data: { body: editBody.trim() } })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditBody(comment.body)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteComment.mutate(comment.id)
  }

  const authorName = isOwn && currentUser
    ? (currentUser.displayName ?? currentUser.username)
    : comment.authorId.slice(0, 8)

  const initials = getInitials(authorName)

  return (
    <div className="flex gap-3.5 group">
      {/* Avatar */}
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border/50">
        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(comment.createdAt)}
          </span>
          {comment.updatedAt > comment.createdAt && (
            <span className="text-xs text-muted-foreground/50 italic shrink-0">(edited)</span>
          )}
        </div>

        {/* Body / Edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="resize-none text-sm pr-14"
                autoFocus
                maxLength={500}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
                {editBody.length}/500
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                onClick={handleSave}
                disabled={updateComment.isPending || !editBody.trim()}
              >
                <CheckIcon className="size-3 mr-1" />
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={handleCancel}>
                <XIcon className="size-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
        )}

        {/* Botón Reply — solo en comentarios raíz (depth === 0) */}
        {depth === 0 && !isEditing && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground -ml-1 h-6 px-1.5 gap-1"
              onClick={() => setShowReplyForm((prev) => !prev)}
            >
              <MessageSquareIcon className="size-3" />
              {replies.length > 0 ? `Reply · ${replies.length}` : 'Reply'}
            </Button>
          </div>
        )}

        {/* ReplyForm inline */}
        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              reviewId={reviewId}
              groupId={groupId}
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies indentadas — siempre visibles si existen */}
        {replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-border/40 space-y-4">
            {replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                isOwn={reply.authorId === currentUser?.id}
                replies={[]}
                depth={1}
                reviewId={reviewId}
                groupId={groupId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions — visible on hover */}
      {isOwn && !isEditing && (
        <div className="flex items-start gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditing(true)}
            aria-label="Edit comment"
            className="text-muted-foreground hover:text-foreground"
          >
            <PencilIcon className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            disabled={deleteComment.isPending}
            aria-label="Delete comment"
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
