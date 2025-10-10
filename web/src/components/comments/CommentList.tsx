import React from "react";
import { Comment } from "@/lib/types/comment";
import { Button } from "@/components/ui/Button";
import { listenComments, updateComment, deleteComment } from "@/lib/api/comments";
import { useEffect, useState } from "react";

interface Props {
  orgId: string;
  traId: string;
  token: string;
  anchor?: string;
}

export default function CommentList({ orgId, traId, token, anchor }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const unsub = listenComments(orgId, traId, (items) => setComments(items), anchor);
    return () => unsub();
  }, [orgId, traId, anchor]);

  if (!comments.length) return <div>No comments yet.</div>;

  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} className="mb-3 p-3 border rounded">
          <div className="flex items-center justify-between">
            <div>
              <strong>{c.authorDisplayName || c.authorId}</strong>
              <span className="text-sm text-slate-500 ml-2">({c.authorRole || "user"})</span>
            </div>
            <div className="text-sm text-slate-500">
              {new Date(c.createdAt as any).toLocaleString()}
            </div>
          </div>

          <div className="mt-2">{c.body}</div>

          <div className="mt-3 flex gap-2">
            {!c.isResolved && (
              <Button
                onClick={async () => {
                  await updateComment(orgId, token, traId, c.id, { isResolved: true }).catch(
                    () => {}
                  );
                }}
              >
                Resolve
              </Button>
            )}
            {c.isResolved && <span className="text-sm text-green-600">Resolved</span>}
            <Button
              onClick={async () => {
                await deleteComment(orgId, token, traId, c.id).catch(() => {});
              }}
              className="bg-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
