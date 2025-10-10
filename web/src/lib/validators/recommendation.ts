import { z } from "zod";

/**
 * Zod validator for recommendations API input
 */

export const RecommendationRequestSchema = z.object({
  hazardId: z.string().min(1),
  context: z
    .object({
      industry: z.string().optional(),
      location: z.string().optional(),
      constraints: z
        .object({
          maxCost: z.union([z.literal("low"), z.literal("medium"), z.literal("high")]).optional(),
          allowPPE: z.boolean().optional(),
          allowAdministrative: z.boolean().optional(),
          allowEngineering: z.boolean().optional(),
        })
        .optional(),
      exposureModifiers: z
        .object({
          exposureMultiplier: z.number().min(0).max(2).optional(),
          frequencyMultiplier: z.number().min(0).max(2).optional(),
        })
        .optional(),
      customAllowed: z.array(z.string()).optional(),
      customBlocked: z.array(z.string()).optional(),
    })
    .optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
