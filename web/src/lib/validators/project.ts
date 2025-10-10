import { z } from "zod";

export const ProjectLocationSchema = z.object({
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(2).optional(),
  geoPoint: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(2000).optional(),
  location: ProjectLocationSchema.optional(),
  visibility: z.enum(["private", "org", "public"]).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(2000).nullable().optional(),
  location: ProjectLocationSchema.nullable().optional(),
  visibility: z.enum(["private", "org", "public"]).optional(),
  settings: z.record(z.unknown()).nullable().optional(),
});

export const MemberInviteSchema = z.object({
  email: z.string().email().optional(),
  uid: z.string().min(1).optional(),
  role: z.enum(["owner", "manager", "contributor", "reader"]),
});
