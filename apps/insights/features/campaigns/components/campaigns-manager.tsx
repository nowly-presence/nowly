"use client";

import { apiFetch } from "@/features/api-target/lib/api-client";
import {
  Button,
  Field,
  FieldLabel,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@nowly/ui";
import { RiFileCopyLine } from "@nowly/ui/icons";
import { useEffect, useState } from "react";

type Campaign = { id: string; name: string; active: boolean; createdAt: string; signupCount: number };

export const CampaignsManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch<{ campaigns: Campaign[] }>("/campaigns")
      .then((data) => setCampaigns(data.campaigns))
      .catch(() => toast.error("Could not load campaigns"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!name.trim()) {
      toast.error("Give this campaign a name");
      return;
    }
    setCreating(true);
    try {
      await apiFetch("/campaigns", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      setName("");
      load();
    } catch {
      toast.error("Could not create campaign");
    } finally {
      setCreating(false);
    }
  };

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    toast.success("Campaign ID copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <Field className="max-w-sm">
          <FieldLabel>Campaign name</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ChromeOS waitlist"
            onKeyDown={(e) => e.key === "Enter" && void create()}
          />
        </Field>
        <Button onClick={create} disabled={creating}>
          {creating ? "Creating..." : "Create campaign"}
        </Button>
      </div>

      {!loading && campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : null}

      {campaigns.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => copyId(campaign.id)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    {campaign.id}
                    <RiFileCopyLine className="size-3.5" />
                  </button>
                </TableCell>
                <TableCell>{campaign.signupCount}</TableCell>
                <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
};
