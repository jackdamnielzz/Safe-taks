import { initializeAdmin } from "./server-helpers";

/**
 * writeAuditLog(orgId, subjectId, actorUid, action, payload)
 * Writes an audit entry to organizations/{orgId}/projectAudits (or project subcollection)
 */
export async function writeAuditLog(
  orgId: string,
  subjectId: string,
  actorUid: string,
  action: string,
  payload: any
) {
  const { firestore } = initializeAdmin();
  const col = firestore.collection("organizations").doc(orgId).collection("projectAudits");
  await col.add({
    subjectId,
    actorUid,
    action,
    payload,
    createdAt: new Date(),
  });
}
