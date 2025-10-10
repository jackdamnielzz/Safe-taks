import { Timestamp } from "firebase/firestore";

export type CommentId = string;

export interface Comment {
  id: CommentId;
  traId: string;
  anchor?: string; // which part of the TRA (e.g. stepId/hazardId)
  body: string;
  authorId: string;
  authorDisplayName?: string;
  authorRole?: string;
  isResolved: boolean;
  resolvedBy?: { uid: string; displayName?: string; role?: string } | null;
  resolvedAt?: Timestamp | Date | null;
  isDeleted: boolean;
  deletedAt?: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  organizationId: string;
  // denormalized fields for fast reads
  denormalized?: {
    traTitle?: string;
  };
}

export interface CreateCommentRequest {
  traId: string;
  anchor?: string;
  body: string;
}

export interface UpdateCommentRequest {
  body?: string | null;
  isResolved?: boolean;
  isDeleted?: boolean;
}
