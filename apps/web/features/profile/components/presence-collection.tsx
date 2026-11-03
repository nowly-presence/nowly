import { LibraryCard } from "@/features/library/components/library-card";
import type { LibraryPresence } from "@/lib/library-catalog";

export const PresenceCollection = ({ presences, locale }: { presences: LibraryPresence[]; locale: string }) => (
  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {presences.map((presence) => (
      <li key={presence.slug}>
        <LibraryCard presence={presence} locale={locale} />
      </li>
    ))}
  </ul>
);