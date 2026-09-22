"use client";

import { ToolCallCard } from "@/features/chat/components/tool-call-card";
import { ViewPreviewCard } from "@/features/chat/components/view-preview-card";
import {
  Bubble,
  BubbleContent,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  Message,
  MessageContent,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@nowly/ui";
import { RiSendPlaneLine } from "@nowly/ui/icons";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { WidgetConfig } from "@nowly/analytics";
import { useState } from "react";

export const ChatPanel = ({ open }: { open: boolean }) => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const submit = () => {
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="hidden md:block" data-state={open ? "expanded" : "collapsed"}>
      {/* Reserves the width in the flex row, exactly like the sidebar's own "gap" div. */}
      <div
        className={cn(
          "relative h-svh bg-transparent transition-[width] duration-200 ease-linear",
          open ? "w-96" : "w-0",
        )}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-96 p-2 transition-[right] duration-200 ease-linear",
          open ? "right-0" : "right-[-24rem]",
        )}
      >
        <div className="flex size-full flex-col rounded-xl bg-sidebar text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border">
          <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
            <span className="text-sm font-semibold">Assistant</span>
          </div>

          <MessageScrollerProvider>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="px-4 py-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-sidebar-foreground/60">
                      Ask for a stat, e.g. "How many YouTube installs from the web library on Firefox on Windows?".
                    </p>
                  ) : null}
                  {messages.map((message) => (
                    <Message key={message.id} align={message.role === "user" ? "end" : "start"}>
                      <MessageContent className="flex flex-col gap-2">
                        {message.parts.map((part, index) => {
                          if (part.type === "text") {
                            return (
                              <Bubble key={index}>
                                <BubbleContent>{part.text}</BubbleContent>
                              </Bubble>
                            );
                          }

                          if (part.type.startsWith("tool-")) {
                            const toolPart = part as unknown as { type: string; state: string; output?: unknown };
                            if (toolPart.type === "tool-generateView" && toolPart.state === "output-available") {
                              return <ViewPreviewCard key={index} output={toolPart.output as { title: string; widget: Omit<WidgetConfig, "id" | "title"> }} />;
                            }
                            return <ToolCallCard key={index} toolName={toolPart.type.replace("tool-", "")} state={toolPart.state} />;
                          }

                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="shrink-0 border-t border-sidebar-border p-3">
            <InputGroup>
              <InputGroupTextarea
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <InputGroupAddon align="block-end">
                <InputGroupButton size="icon-sm" className="ml-auto" onClick={submit}>
                  <RiSendPlaneLine />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
    </div>
  );
};
