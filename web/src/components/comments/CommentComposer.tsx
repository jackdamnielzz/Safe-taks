import React, { useState } from "react";
import { CreateCommentInput } from "@/lib/validators/comment";
import { createComment } from "@/lib/api/comments";
import { Button } from "@/components/ui/Button";
import TextArea from "@/components/ui/TextArea";

interface Props {
  orgId: string;
  traId: string;
  token: string;
  anchor?: string;
  onCreated?: (item: any) => void;
}

export default function CommentComposer({ orgId, traId, token, anchor, onCreated }: Props) {
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const disabled = isSaving || body.trim().length === 0;

  async function submit() {
    if (disabled) return;
    setIsSaving(true);
    const input: CreateCommentInput = { traId, anchor, body };
    try {
      const res = await createComment(orgId, token, input);
      if (onCreated) onCreated(res);
      setBody("");
    } catch (err) {
      console.error("Create comment failed", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-3 border rounded">
      <label className="block text-sm font-medium mb-1">New comment</label>
      <TextArea
        id="comment-body"
        label=""
        placeholder="Write your comment..."
        register={undefined as any}
        rows={4}
        className="w-full"
      />
      <div className="mt-2 flex justify-end">
        <Button onClick={submit} disabled={disabled} type="button">
          {isSaving ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </div>
  );
}
