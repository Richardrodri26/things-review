import type { User, UpdateUserDTO } from '@/entities/user/types'
import type { IUserService } from '../user.service'
import { apiGet, apiPatch } from './api-client'

export class ApiUserService implements IUserService {
  async get(): Promise<User | null> {
    try {
      return await apiGet<User>('/me')
    } catch {
      return null
    }
  }

  async create(): Promise<User> {
    // La creación de usuario ocurre a través de Better Auth signUp — no a través de este servicio
    throw new Error(
      'ApiUserService.create() no aplica — usá signUp() de Better Auth para crear usuarios'
    )
  }

  async update(data: UpdateUserDTO): Promise<User> {
    return apiPatch<User>('/me', data)
  }

  async delete(): Promise<void> {
    // La eliminación de cuenta se maneja a través de Better Auth
    throw new Error('Eliminación de cuenta no implementada')
  }
}
