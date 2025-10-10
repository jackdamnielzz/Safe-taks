/**
 * Project types for SafeWork Pro
 * Generated: 2025-10-02
 */

/**
 * Lightweight Timestamp representation to avoid depending on specific SDK types
 * This keeps types flexible for client (firebase/firestore) or admin (firebase-admin) usage.
 */
export type TimestampLike = string | number | { seconds: number; nanoseconds: number };

export type ProjectVisibility = "private" | "org" | "public";

export type ProjectMemberRole = "owner" | "manager" | "contributor" | "reader";

export interface UserRef {
  uid: string;
  displayName?: string;
  email?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ProjectLocation {
  address?: string;
  city?: string;
  country?: string;
  geoPoint?: GeoPoint;
}

export interface ProjectMember {
  id?: string; // document id in members subcollection
  uid: string;
  role: ProjectMemberRole;
  invitedBy?: UserRef;
  invitedAt?: TimestampLike;
  joinedAt?: TimestampLike;
  isActive?: boolean;
  permissionsOverrides?: string[];
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface ProjectStats {
  trasCount: number;
  lastActivityAt?: TimestampLike;
}

export interface Project {
  id: string; // document id
  name: string;
  slug?: string;
  description?: string;
  location?: ProjectLocation;
  createdBy: UserRef;
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
  isActive?: boolean;
  retentionPolicy?: {
    archivedAt?: TimestampLike;
    retentionDays?: number;
  };
  visibility?: ProjectVisibility;
  metadata?: Record<string, any>;
  memberCount?: number;
  membersSummary?: { uid: string; role: ProjectMemberRole; displayName?: string }[];
  settings?: Record<string, any>;
  stats?: ProjectStats;
}

/**
 * API request/response shapes
 */
export interface ProjectCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  location?: ProjectLocation;
  visibility?: ProjectVisibility;
  settings?: Record<string, any>;
}

export interface ProjectUpdateRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  location?: ProjectLocation | null;
  visibility?: ProjectVisibility;
  settings?: Record<string, any> | null;
}
