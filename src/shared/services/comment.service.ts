// shared/services/comment.service.ts
import type { Comment, CommentWithAuthor, CommentThread, CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface ICommentService {
  getByReviewId(reviewId: string): Promise<CommentThread[]>
  create(data: CreateCommentDTO): Promise<Comment>
  update(id: string, data: UpdateCommentDTO): Promise<Comment>
  delete(id: string): Promise<void>
}

/**
 * Agrupa una lista plana de comentarios en árboles de 1 nivel.
 *
 * Actualmente solo se soporta 1 nivel: raíces (parentId === null) con sus replies directas.
 * Para escalar a hilos infinitos, hacer esta función recursiva:
 *   - Cambiar el tipo de retorno a un tipo árbol recursivo
 *   - Iterar sobre todos los nodos, no solo las raíces
 * Ver docs/plans/2026-03-30-comment-replies.md para la guía completa.
 *
 * NOTE: This local (localStorage) implementation doesn't have real author data.
 * The API implementation (ApiCommentService) returns full author info from the DB.
 */
function toCommentWithAuthor(c: Comment): CommentWithAuthor {
  return {
    ...c,
    // Local service doesn't have author info — provide a minimal placeholder.
    // In production the API service is used and returns real author data.
    author: { id: c.authorId, username: c.authorId, displayName: c.authorId, avatarUrl: undefined },
  }
}

function buildCommentThreads(comments: Comment[]): CommentThread[] {
  const roots = comments.filter((c) => c.parentId === null)
  const byParent = new Map<string, Comment[]>()

  for (const c of comments) {
    if (c.parentId !== null) {
      const list = byParent.get(c.parentId) ?? []
      list.push(c)
      byParent.set(c.parentId, list)
    }
  }

  return roots.map((root) => ({
    ...toCommentWithAuthor(root),
    replies: (byParent.get(root.id) ?? []).map(toCommentWithAuthor),
  }))
}

export class LocalCommentService implements ICommentService {
  private readAll(): Comment[] {
    return getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, [])
  }

  private writeAll(comments: Comment[]): void {
    setToStorage(STORAGE_KEYS.COMMENTS, comments)
  }

  async getByReviewId(reviewId: string): Promise<CommentThread[]> {
    const all = this.readAll().filter((c) => c.reviewId === reviewId)
    return buildCommentThreads(all)
  }

  async create(data: CreateCommentDTO): Promise<Comment> {
    const comment: Comment = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeAll([...this.readAll(), comment])
    return comment
  }

  async update(id: string, data: UpdateCommentDTO): Promise<Comment> {
    const all = this.readAll()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Comment not found: ${id}`)
    const updated: Comment = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    const all = this.readAll()
    // Al borrar un comentario raíz, también se borran sus replies (cascade delete)
    const target = all.find((c) => c.id === id)
    const idsToDelete = new Set([id])
    if (target && target.parentId === null) {
      all.filter((c) => c.parentId === id).forEach((c) => idsToDelete.add(c.id))
    }
    this.writeAll(all.filter((c) => !idsToDelete.has(c.id)))
  }
}
