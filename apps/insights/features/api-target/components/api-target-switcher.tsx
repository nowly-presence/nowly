"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@nowly/ui";
import { getClientApiTarget, setClientApiTarget, type ApiTarget } from "@/features/api-target/lib/api-target";
import { RiCloudLine } from "@nowly/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const items: Array<{ value: ApiTarget; label: string }> = [
  { value: "prod", label: "Production" },
  { value: "dev", label: "Development" },
];

export const ApiTargetSwitcher = () => {
  const router = useRouter();
  const [target, setTarget] = useState<ApiTarget>("prod");

  useEffect(() => {
    setTarget(getClientApiTarget());
  }, []);

  return (
    <Select
      items={items}
      value={target}
      onValueChange={(value) => {
        if (!value) return;
        setClientApiTarget(value as ApiTarget);
        setTarget(value as ApiTarget);
        router.refresh();
      }}
    >
      <SelectTrigger className="w-full" size="sm">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <RiCloudLine className="size-4 text-muted-foreground" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
