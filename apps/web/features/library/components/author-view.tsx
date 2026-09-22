import { AuthorViewTracker } from "@/features/library/components/author-view-tracker";
import { PaginatedLibraryGrid } from "@/features/library/components/paginated-library-grid";
import { ButtonLink } from "@/components/button-link";
import { Avatar, AvatarFallback, AvatarImage, ButtonAnchor } from "@nowly/ui";


import {
  contributorDisplayName,
  type LibraryPresence,
} from "@/lib/library-catalog";
import { RiArrowLeftLine, RiGithubLine } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

type AuthorViewProps = {
  handle: string
  items: LibraryPresence[]
};

export const AuthorView = async ({ handle, items }: AuthorViewProps) => {
  const t = await getTranslations("authorPage");
  const name = items[0] ? contributorDisplayName(items[0], handle) : handle;

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <AuthorViewTracker />
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <ButtonLink href="/library" variant="ghost" size="sm">
          <RiArrowLeftLine data-icon="inline-start" />
          {t("back")}
        </ButtonLink>

        <header className="mt-10 max-w-xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("badge")}
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Avatar size="lg" className="size-16 shrink-0">
              <AvatarImage src={`https://github.com/${encodeURIComponent(handle)}.png?size=128`} alt={name} />
              <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h1 className="min-w-0 text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
              {name}
            </h1>
          </div>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description", { count: items.length })}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink href={`/library?author=${encodeURIComponent(handle)}`} variant="outline" size="sm">
              {t("view-in-library")}
            </ButtonLink>
            <ButtonAnchor
              href={`https://github.com/${encodeURIComponent(handle)}`}
              rel="noreferrer"
              target="_blank"
              variant="outline"
              size="sm"
            >
              <RiGithubLine data-icon="inline-start" />
              GitHub
            </ButtonAnchor>
          </div>
        </header>

        <PaginatedLibraryGrid items={items} className="mt-12" />
      </div>
    </div>
  );
};
