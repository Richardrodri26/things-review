// shared/services/group.service.ts
import type { Group, GroupMembership, CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import type { GroupRole } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId, generateInviteCode } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface IGroupService {
  getAll(): Promise<Group[]>
  getById(id: string): Promise<Group | null>
  getByInviteCode(code: string): Promise<Group | null>
  create(data: CreateGroupDTO, ownerId: string): Promise<Group>
  update(id: string, data: UpdateGroupDTO): Promise<Group>
  delete(id: string): Promise<void>
  // Membership
  getMemberships(userId: string): Promise<GroupMembership[]>
  addMember(groupId: string, userId: string, role?: GroupRole): Promise<GroupMembership>
  removeMember(groupId: string, userId: string): Promise<void>
  getMemberIds(groupId: string): Promise<string[]>
}

export class LocalGroupService implements IGroupService {
  private readGroups(): Group[] {
    return getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, [])
  }

  private writeGroups(groups: Group[]): void {
    setToStorage(STORAGE_KEYS.GROUPS, groups)
  }

  private readMemberships(): GroupMembership[] {
    return getFromStorage<GroupMembership[]>(STORAGE_KEYS.MEMBERSHIPS, [])
  }

  private writeMemberships(memberships: GroupMembership[]): void {
    setToStorage(STORAGE_KEYS.MEMBERSHIPS, memberships)
  }

  async getAll(): Promise<Group[]> {
    return this.readGroups()
  }

  async getById(id: string): Promise<Group | null> {
    return this.readGroups().find(g => g.id === id) ?? null
  }

  async getByInviteCode(code: string): Promise<Group | null> {
    return this.readGroups().find(g => g.inviteCode === code) ?? null
  }

  async create(data: CreateGroupDTO, ownerId: string): Promise<Group> {
    const group: Group = {
      ...data,
      id: generateId(),
      inviteCode: generateInviteCode(),
      memberIds: [ownerId],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeGroups([...this.readGroups(), group])
    // Auto-agregar membresía del owner
    await this.addMember(group.id, ownerId, 'owner')
    return group
  }

  async update(id: string, data: UpdateGroupDTO): Promise<Group> {
    const all = this.readGroups()
    const idx = all.findIndex(g => g.id === id)
    if (idx === -1) throw new Error(`Group not found: ${id}`)
    const updated: Group = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeGroups(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.writeGroups(this.readGroups().filter(g => g.id !== id))
    this.writeMemberships(this.readMemberships().filter(m => m.groupId !== id))
  }

  async getMemberships(userId: string): Promise<GroupMembership[]> {
    return this.readMemberships().filter(m => m.userId === userId)
  }

  async addMember(groupId: string, userId: string, role: GroupRole = 'member'): Promise<GroupMembership> {
    const existing = this.readMemberships().find(
      m => m.groupId === groupId && m.userId === userId
    )
    if (existing) return existing

    const membership: GroupMembership = { userId, groupId, role, joinedAt: new Date() }
    this.writeMemberships([...this.readMemberships(), membership])

    // Actualizar memberIds del grupo
    const groups = this.readGroups()
    const groupIdx = groups.findIndex(g => g.id === groupId)
    if (groupIdx !== -1 && !groups[groupIdx].memberIds.includes(userId)) {
      groups[groupIdx].memberIds.push(userId)
      this.writeGroups(groups)
    }

    return membership
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    this.writeMemberships(
      this.readMemberships().filter(m => !(m.groupId === groupId && m.userId === userId))
    )
    const groups = this.readGroups()
    const groupIdx = groups.findIndex(g => g.id === groupId)
    if (groupIdx !== -1) {
      groups[groupIdx].memberIds = groups[groupIdx].memberIds.filter(id => id !== userId)
      this.writeGroups(groups)
    }
  }

  async getMemberIds(groupId: string): Promise<string[]> {
    return this.readMemberships()
      .filter(m => m.groupId === groupId)
      .map(m => m.userId)
  }
}
