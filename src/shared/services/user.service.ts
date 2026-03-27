// shared/services/user.service.ts
import type { User, CreateUserDTO, UpdateUserDTO } from '@/entities/user/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage, removeFromStorage } from './localStorage.service'

export interface IUserService {
  get(): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
  update(data: UpdateUserDTO): Promise<User>
  delete(): Promise<void>
}

export class LocalUserService implements IUserService {
  async get(): Promise<User | null> {
    return getFromStorage<User | null>(STORAGE_KEYS.USER, null)
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setToStorage(STORAGE_KEYS.USER, user)
    return user
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const current = await this.get()
    if (!current) throw new Error('No user found')
    const updated: User = {
      ...current,
      ...data,
      updatedAt: new Date(),
    }
    setToStorage(STORAGE_KEYS.USER, updated)
    return updated
  }

  async delete(): Promise<void> {
    removeFromStorage(STORAGE_KEYS.USER)
  }
}
