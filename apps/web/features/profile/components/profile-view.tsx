import { ButtonLink } from "@/components/button-link";
import type { PublicProfile } from "@/features/profile/lib/public-profile";
import { presenceLogoUrl } from "@/lib/presence-api-client";
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardTitle } from "@nowly/ui";
import { getTranslations } from "next-intl/server";

const PresenceList = ({ title, empty, items }: { title: string; empty: string; items: NonNullable<PublicProfile["created"]> }) => (
  <Card>
    <CardContent>
      <CardTitle className="text-lg">{title}</CardTitle>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug}>
              <ButtonLink href={`/library/${encodeURIComponent(item.slug)}`} variant="outline" className="h-auto w-full justify-start gap-3 py-2">
                <img src={presenceLogoUrl(item.slug)} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg bg-muted object-cover" />
                <span className="truncate">{item.name}</span>
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export const ProfileView = async ({ profile }: {
  profile: PublicProfile;
}) => {
  const t = await getTranslations("profilePage");
  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-10">
        <header className="flex items-center gap-5">
          <Avatar size="lg" className="size-20 shrink-0">
            {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
            <AvatarFallback>{profile.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
            <h1 className="mt-1 truncate text-[2rem] font-medium leading-tight tracking-tight text-foreground sm:text-[2.5rem]">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          </div>
        </header>
        {profile.bio ? <p className="mt-6 max-w-2xl whitespace-pre-line text-[1.05rem] leading-relaxed text-foreground/75">{profile.bio}</p> : null}
        <div className="mt-10 flex flex-col gap-6">
          {profile.created ? <PresenceList title={t("created-title")} empty={t("empty")} items={profile.created} /> : null}
          {profile.liked ? <PresenceList title={t("liked-title")} empty={t("empty")} items={profile.liked} /> : null}
        </div>
      </div>
    </div>
  );
};