import { insightsTools } from "@/ai/tools";
import { buildInstructions } from "@/ai/instructions";
import { API_TARGET_COOKIE, apiBaseUrlFor, resolveApiTarget } from "@/lib/api-target";
import { openai } from "@ai-sdk/openai";
import { createAgentUIStreamResponse, stepCountIs, ToolLoopAgent, validateUIMessages, type InferAgentUIMessage } from "ai";

export const POST = async (request: Request): Promise<Response> => {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Chat is not configured (missing OPENAI_API_KEY)" }, { status: 503 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const targetMatch = cookieHeader.match(new RegExp(`${API_TARGET_COOKIE}=([^;]+)`));
  const target = resolveApiTarget(targetMatch?.[1]);

  const { messages } = await request.json();

  const tools = insightsTools({ apiBaseUrl: apiBaseUrlFor(target), cookie: cookieHeader });

  const agent = new ToolLoopAgent({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    instructions: buildInstructions(),
    tools,
    stopWhen: stepCountIs(6),
  });

  const uiMessages = await validateUIMessages<InferAgentUIMessage<typeof agent>>({ messages, tools: agent.tools });

  return createAgentUIStreamResponse({
    agent,
    uiMessages,
  });
};
