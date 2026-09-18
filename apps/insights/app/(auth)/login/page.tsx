"use client";

import { ApiTargetSwitcher } from "@/components/api-target-switcher";
import { Button, Card, CardContent } from "@nowly/ui";
import { apiBaseUrlFor, getClientApiTarget } from "@/lib/api-target";
import { RiDiscordFill } from "@nowly/ui/icons";
import { useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const target = getClientApiTarget();
      const res = await fetch(`${apiBaseUrlFor(target)}/auth/sign-in/social`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "discord", callbackURL: `${window.location.origin}/` }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error("sign-in-failed");
      window.location.href = data.url;
    } catch {
      setError("Could not start sign-in. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 py-8 text-center">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Nowly Insights</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your admin Discord account.</p>
          </div>

          <Button className="w-full" size="lg" onClick={signIn} disabled={loading}>
            <RiDiscordFill data-icon="inline-start" />
            {loading ? "Redirecting..." : "Sign in with Discord"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="w-full">
            <ApiTargetSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
