import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  getFirestore,
  Firestore,
} from "firebase/firestore";
import { CreateCommentInput, UpdateCommentInput } from "@/lib/validators/comment";
import { Comment } from "@/lib/types/comment";
import { db as clientDb } from "@/lib/firebase";

const firestore: Firestore = clientDb;

/**
 * Listen to comments for a given TRA (optional anchor)
 */
export function listenComments(
  orgId: string,
  traId: string,
  onChange: (items: Comment[]) => void,
  anchor?: string
) {
  const col = collection(firestore, `organizations/${orgId}/tras/${traId}/comments`);
  let q = query(col, where("isDeleted", "==", false), orderBy("createdAt", "desc"));
  if (anchor) {
    q = query(
      col,
      where("isDeleted", "==", false),
      where("anchor", "==", anchor),
      orderBy("createdAt", "desc")
    );
  }
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as Comment);
    onChange(items);
  });
}

/**
 * Create comment (client helper calling server API)
 * Uses REST API route for server-side permission checks and audit
 */
export async function createComment(orgId: string, token: string, input: CreateCommentInput) {
  const res = await fetch(`/api/tras/${input.traId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-ID": orgId,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create comment");
  }
  return res.json();
}

/**
 * Update comment (body/edit/resolve) via server API
 */
export async function updateComment(
  orgId: string,
  token: string,
  traId: string,
  commentId: string,
  input: UpdateCommentInput
) {
  const res = await fetch(`/api/tras/${traId}/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-ID": orgId,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to update comment");
  }
  return res.json();
}

/**
 * Soft-delete comment
 */
export async function deleteComment(
  orgId: string,
  token: string,
  traId: string,
  commentId: string
) {
  const res = await fetch(`/api/tras/${traId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Organization-ID": orgId,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to delete comment");
  }
  return res.json();
}
