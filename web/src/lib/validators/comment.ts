import { z } from "zod";

export const CreateCommentSchema = z.object({
  traId: z.string().min(1),
  anchor: z.string().optional(),
  body: z.string().min(1).max(2000),
});

export const UpdateCommentSchema = z.object({
  body: z.string().min(1).max(2000).optional(),
  isResolved: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
