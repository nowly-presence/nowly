import { z } from "zod";
import { publicationImageSchema, publicationHttpsSchema as https } from "./activity-publication-image";

export { publicationImageSchema, publicationColors, publicationIcons, isPublicationImage } from "./activity-publication-image";

export const PUBLICATION_MAX_BYTES = 3 * 1024 * 1024;
export const PUBLICATION_QUOTA = 20;
export const publicationIdSchema = z.string().regex(/^[a-f0-9]{32}$/);
const text = z
  .string()
  .trim()
  .max(128)
  .refine((value) => value === "" || value.trim().length >= 2);
export const portableActivitySchema = z
  .object({
    name: text.refine((value) => value.trim().length >= 2),
    type: z.union([
      z.literal(0),
      z.literal(2),
      z.literal(3),
      z.literal(5)
    ]),
    details: text,
    state: text,
    largeImage: publicationImageSchema,
    largeText: text,
    smallImage: publicationImageSchema,
    smallText: text,
    timestamp: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal("elapsed") }).strict(),
      z
        .object({
          mode: z.literal("countdown"),
          minutes: z.number().int().min(5).max(1440)
        })
        .strict()
    ]),
    buttons: z
      .array(
        z
          .object({
            label: z.string().trim().min(2).max(32),
            url: https
          })
          .strict()
      )
      .max(2)
  })
  .strict();

export type PortableActivity = z.infer<typeof portableActivitySchema>;

export const publicationSchema = z
  .object({
    id: publicationIdSchema,
    revision: z.number().int().positive(),
    activity: portableActivitySchema,
    author: z
      .object({
        name: z.string().max(128),
        image: https.nullable()
      })
      .strict()
  })
  .strict();

export type ActivityPublication = z.infer<typeof publicationSchema>;

export const publicationWriteSchema = z
  .object({
    id: publicationIdSchema,
    activity: portableActivitySchema,
    baseRevision: z.number().int().nonnegative()
  })
  .strict();
export const publicationReserveSchema = z.object({ activity: portableActivitySchema }).strict();
export const publicationReviewSchema = z
  .object({
    id: publicationIdSchema,
    revision: z.number().int().positive(),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/)
  })
  .strict();
export const publicationApplySchema = publicationReviewSchema
  .extend({
    localFingerprint: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    choice: z.enum(["install", "keep", "replace"])
  })
  .strict();

export type PublicationReview = z.infer<typeof publicationReviewSchema>;
export type PublicationApply = z.infer<typeof publicationApplySchema>;
export type PublicationStatus = {
  ok: true;
  installed: boolean;
  revision: number | null;
  modified: boolean;
  localFingerprint: string | null;
} | {
  ok: false;
  error: string;
};
export type PublicationResult = {
  ok: true;
} | {
  ok: false;
  error: string;
};

export const ownedPublicationSchema = z
  .object({
    id: publicationIdSchema,
    revision: z.number().int().nonnegative(),
    published: z.boolean()
  })
  .strict();
export const ownedPublicationMapSchema = z.record(z.string(), ownedPublicationSchema);
export const ownedPublicationResponseSchema = z.object({ publication: ownedPublicationSchema.nullable() }).strict();
export const publicationAttemptsSchema = z.record(
  z.string(),
  z
    .object({
      id: publicationIdSchema,
      apiBase: z.string().url(),
      pending: z.boolean()
    })
    .strict()
);
export const publicationAbsenceSchema = z.object({ error: z.enum(["NOT_FOUND", "UNPUBLISHED"]) }).strict();