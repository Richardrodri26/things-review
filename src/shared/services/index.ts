// shared/services/index.ts — Service Container
// Para cambiar de localStorage a API: swap de imports a continuación

// ─── Implementaciones de API (backend real) ───────────────────────────────────
import { ApiUserService } from './api/user.service'
import { ApiReviewService } from './api/review.service'
import { ApiGroupService } from './api/group.service'
import { ApiWatchlistService } from './api/watchlist.service'
import { ApiCommentService } from './api/comment.service'

// ─── Catálogo: ahora desde la DB via API ─────────────────────────────────────
import { ApiCatalogService } from './api/catalog.service'

export const services = {
  users: new ApiUserService(),
  reviews: new ApiReviewService(),
  groups: new ApiGroupService(),
  catalog: new ApiCatalogService(),
  watchlist: new ApiWatchlistService(),
  comments: new ApiCommentService(),
} as const

export type Services = typeof services

// Re-export interfaces para uso en features/entities
export type { IUserService } from './user.service'
export type { IReviewService } from './review.service'
export type { IGroupService } from './group.service'
export type { ICatalogService, CatalogItem, AddItemDTO } from './catalog.service'
export type { IWatchlistService } from './watchlist.service'
export type { ICommentService } from './comment.service'
