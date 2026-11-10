import { serverEnv } from "@nowly/env/server";
import { z } from "zod";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const CODE_FENCE = /^```(?:json)?|```$/g;

const RunSchema = z.object({
  success: z.boolean(),
  result: z
    .object({
      response: z.unknown().optional(),
      choices: z.array(z.object({ message: z.object({ content: z.unknown() }) })).optional()
    })
    .nullable()
    .optional()
});

export class WorkersAiHttpError extends Error {
  constructor(readonly status: number) {
    super(`Workers AI answered ${status}`);
    this.name = "WorkersAiHttpError";
  }
}

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const accountId = (): string | undefined => serverEnv.WORKERS_AI_ACCOUNT_ID ?? serverEnv.R2_ACCOUNT_ID;

export const hasWorkersAi = (): boolean => Boolean(serverEnv.WORKERS_AI_API_TOKEN && accountId());

const asJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value.replace(CODE_FENCE, "").trim());
  } catch {
    return null;
  }
};

export const runJsonModel = async (messages: ChatMessage[], schema: Record<string, unknown>): Promise<unknown> => {
  const response = await fetch(`${CLOUDFLARE_API}/accounts/${accountId()}/ai/run/${serverEnv.WORKERS_AI_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.WORKERS_AI_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: schema
      }
    })
  });

  if (!response.ok) throw new WorkersAiHttpError(response.status);

  const body = RunSchema.parse(await response.json());

  if (!body.success || !body.result) throw new Error("Workers AI returned no result");

  return asJson(body.result.response ?? body.result.choices?.[0]?.message.content ?? null);
};