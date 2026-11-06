import { z } from "zod";
import { REPORT_ATTACHMENTS_MAX, REPORT_CHOICES_MAX, REPORT_CHOICE_MAX_LENGTH, REPORT_LABEL_MAX_LENGTH, REPORT_MESSAGE_MAX_LENGTH, REPORT_STATUSES } from "./report.constants";

const bodySchema = z.string().trim().min(1).max(REPORT_MESSAGE_MAX_LENGTH);

export const CreateReportSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  message: bodySchema,
  anonymous: z.boolean(),
  label: z.string().trim().min(1).max(REPORT_LABEL_MAX_LENGTH).optional(),
  labelSource: z.enum(["discord_link", "native_host"]).optional(),
  notify: z.boolean().default(false),
  locale: z.string().trim().max(20).optional(),
  browser: z.string().trim().max(60).optional(),
  browserVersion: z.string().trim().max(40).optional(),
  extensionVersion: z.string().trim().max(40).optional()
});

const attachmentsSchema = z
  .array(z.string().max(6 * 1024 * 1024))
  .max(REPORT_ATTACHMENTS_MAX)
  .default([]);

export const ReporterMessageSchema = z
  .object({
    message: z.string().trim().max(REPORT_MESSAGE_MAX_LENGTH).default(""),
    attachments: attachmentsSchema,
    answerTo: z.string().trim().min(1).max(80).optional()
  })
  .refine((value) => value.message.length > 0 || value.attachments.length > 0, { message: "EMPTY" });

export const NotifySchema = z.object({ notify: z.boolean() });

export const StaffMessageSchema = z
  .object({
    message: z.string().trim().max(REPORT_MESSAGE_MAX_LENGTH).default(""),
    attachments: attachmentsSchema,
    visibility: z.enum(["public", "internal"]).default("public"),
    statusTo: z.enum(REPORT_STATUSES).optional(),
    choices: z.array(z.string().trim().min(1).max(REPORT_CHOICE_MAX_LENGTH)).min(2).max(REPORT_CHOICES_MAX).optional()
  })
  .refine((value) => value.message.length > 0 || value.statusTo !== undefined || value.attachments.length > 0, { message: "EMPTY" })
  .refine(
    (value) =>
      value.visibility === "public" ||
      (value.statusTo === undefined && value.choices === undefined && value.attachments.length === 0 && value.message.length > 0),
    { message: "INTERNAL_NOTE_ONLY" }
  );

export const StatusSchema = z.object({ status: z.enum(REPORT_STATUSES) });

export const AssigneeSchema = z.object({ assigneeId: z.string().trim().min(1).max(80).nullable() });

export const StaffQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  mine: z.enum(["1"]).optional(),
  before: z.coerce.date().optional()
});

export const UpdatesQuerySchema = z.object({ since: z.coerce.date().optional() });