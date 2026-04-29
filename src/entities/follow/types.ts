export interface FollowStatus {
  isFollowing: boolean
  followerCount: number
  followingCount: number
}

export interface UserPublicProfile {
  id: string
  username: string | null
  displayName: string | null
  image: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  reviewCount: number
  isFollowing: boolean
  createdAt: Date
}
