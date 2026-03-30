import type { Group, GroupMembership, CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import type { GroupRole } from '@/shared/types'
import type { IGroupService } from '../group.service'
import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'

export class ApiGroupService implements IGroupService {
  async getAll(): Promise<Group[]> {
    return apiGet<Group[]>('/groups')
  }

  async getById(id: string): Promise<Group | null> {
    try {
      return await apiGet<Group>(`/groups/${id}`)
    } catch {
      return null
    }
  }

  async getByInviteCode(code: string): Promise<Group | null> {
    // No hay endpoint GET por inviteCode — se usa POST /groups/join
    throw new Error(`getByInviteCode no aplica en ApiGroupService — usá joinByCode('${code}')`)
  }

  async create(data: CreateGroupDTO, _ownerId: string): Promise<Group> {
    // El backend inyecta el ownerId desde la sesión
    return apiPost<Group>('/groups', data)
  }

  async update(id: string, data: UpdateGroupDTO): Promise<Group> {
    return apiPatch<Group>(`/groups/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiDelete(`/groups/${id}`)
  }

  async getMemberships(userId: string): Promise<GroupMembership[]> {
    return apiGet<GroupMembership[]>(`/groups/members?userId=${userId}`)
  }

  async addMember(_groupId: string, _userId: string, _role?: GroupRole): Promise<GroupMembership> {
    throw new Error('addMember: usá joinByInviteCode en su lugar')
  }

  async removeMember(groupId: string, _userId: string): Promise<void> {
    return apiDelete(`/groups/${groupId}/members`)
  }

  async getMemberIds(groupId: string): Promise<string[]> {
    const group = await this.getById(groupId)
    return group?.memberIds ?? []
  }

  /** Unirse a un grupo mediante código de invitación */
  async joinByInviteCode(inviteCode: string): Promise<Group> {
    return apiPost<Group>('/groups/join', { inviteCode })
  }
}
