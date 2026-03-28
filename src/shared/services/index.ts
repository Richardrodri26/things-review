// shared/services/index.ts
import { LocalUserService } from './user.service'
import { LocalReviewService } from './review.service'
import { LocalGroupService } from './group.service'
import { LocalCatalogService } from './catalog.service'

// Service Container — cambiar implementaciones aquí cuando llegue el backend
export const services = {
  users: new LocalUserService(),
  reviews: new LocalReviewService(),
  groups: new LocalGroupService(),
  catalog: new LocalCatalogService(),
} as const

export type Services = typeof services

// Re-export interfaces para uso en features/entities
export type { IUserService } from './user.service'
export type { IReviewService } from './review.service'
export type { IGroupService } from './group.service'
export type { ICatalogService, CatalogItem } from './catalog.service'
