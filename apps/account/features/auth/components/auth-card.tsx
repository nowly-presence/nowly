"use client";

import { Card, CardContent } from "@nowly/ui";
import { RiArrowRightLine } from "@nowly/ui/icons";
import type { PropsWithChildren, ReactNode } from "react";

const Tile = ({ children }: PropsWithChildren) => (
  <div className="flex size-14 items-center justify-center rounded-[16px] bg-foreground/6 p-1.5 ring-1 ring-foreground/10">
    <div className="flex size-full items-center justify-center rounded-[10px] bg-background">{children}</div>
  </div>
);

export const AuthCard = ({ mark, linked, title, description, permissions, children }: PropsWithChildren<{
  mark?: ReactNode;
  linked?: ReactNode;
  title: string;
  description: string;
  permissions?: readonly string[];
}>) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        {mark ? (
          <div className="flex items-center justify-center gap-3">
            <Tile>{mark}</Tile>
            {linked ? (
              <>
                <RiArrowRightLine className="size-4 text-muted-foreground" aria-hidden />
                <Tile>{linked}</Tile>
              </>
            ) : null}
          </div>
        ) : null}
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        {permissions && permissions.length > 0 ? (
          <ul className="flex flex-col gap-2.5 rounded-[10px] p-4 text-sm text-foreground ring-1 ring-foreground/10">
            {permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
};