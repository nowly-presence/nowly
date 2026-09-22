import { insightsTools } from "@/features/chat/lib/tools";
import { buildInstructions } from "@/features/chat/lib/instructions";
import { API_TARGET_COOKIE, apiBaseUrlFor, resolveApiTarget } from "@/features/api-target/lib/api-target";
import { openai } from "@ai-sdk/openai";
import { createAgentUIStreamResponse, stepCountIs, ToolLoopAgent, validateUIMessages, type InferAgentUIMessage } from "ai";

export const POST = async (request: Request): Promise<Response> => {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "CHAT_NOT_CONFIGURED" }, { status: 503 });
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
