"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { useChatPanel } from "@/hooks/use-chat-panel";
import { Button, SidebarInset, SidebarTrigger } from "@nowly/ui";
import { RiChatAiLine } from "@nowly/ui/icons";
import type { PropsWithChildren } from "react";

export const DashboardShell = ({ children }: PropsWithChildren) => {
  const chat = useChatPanel();

  return (
    <>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SidebarTrigger />
          <Button variant="ghost" size="icon" onClick={chat.toggle} aria-label="Toggle assistant">
            <RiChatAiLine />
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </SidebarInset>

      <ChatPanel open={chat.isOpen} />
    </>
  );
};
