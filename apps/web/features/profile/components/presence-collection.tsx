"use client";

import { LibraryMedia } from "@/features/library/components/library-media";
import type { PublicProfile } from "@/features/profile/lib/public-profile";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardTitle } from "@nowly/ui";

type Item = NonNullable<PublicProfile["created"]>[number];

export const PresenceCollection = ({ items }: { items: Item[] }) => (
  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <li key={item.slug}>
        <Link href={`/library/${encodeURIComponent(item.slug)}`} className="block rounded-[16px] outline-offset-4">
          <Card className="h-full gap-0 py-0 transition-colors hover:bg-foreground/6">
            <LibraryMedia slug={item.slug} name={item.name} />
            <CardContent className="pt-4 pb-5">
              <CardTitle className="truncate">{item.name}</CardTitle>
            </CardContent>
          </Card>
        </Link>
      </li>
    ))}
  </ul>
);