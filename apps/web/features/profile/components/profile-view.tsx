import { PresenceCollection } from "@/features/profile/components/presence-collection";
import type { PublicProfile } from "@/features/profile/lib/public-profile";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@nowly/ui";
import { RiVerifiedBadgeFill } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-4 flex items-baseline gap-2 text-lg font-medium text-foreground">
      {title}
      <span className="text-sm font-normal text-muted-foreground">{count}</span>
    </h2>
    {children}
  </section>
);

export const ProfileView = async ({ profile }: {
  profile: PublicProfile;
}) => {
  const t = await getTranslations("profilePage");

  const handle = profile.username ?? profile.handle;
  return (
    <div className="pb-24 pt-24 sm:pb-32 sm:pt-32">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-10">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-36 w-full bg-linear-to-br from-accent/45 via-accent/20 to-secondary sm:h-52">
            {profile.banner ? <img src={profile.banner} alt="" className="size-full object-cover" /> : null}
          </div>
          <div className="px-5 pb-6 sm:px-8">
            <Avatar className="-mt-12 size-24 shrink-0 border-4 border-card sm:-mt-16 sm:size-32">
              {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
              <AvatarFallback className="text-3xl">{profile.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h1 className="mt-3 flex items-center gap-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.1rem]">
              <span className="truncate">{profile.name}</span>
              {profile.verified ? <RiVerifiedBadgeFill className="size-6 shrink-0 text-accent" aria-label={t("verified")} role="img" /> : null}
            </h1>
            <p className="text-sm text-muted-foreground">@{handle}</p>
            {profile.role ? (
              <Badge variant="secondary" className="mt-3">
                {t(profile.role === "admin" ? "role-admin" : "role-moderator")}
              </Badge>
            ) : null}
            {profile.bio ? <p className="mt-4 max-w-2xl whitespace-pre-line text-[0.95rem] leading-relaxed text-foreground/80">{profile.bio}</p> : null}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-10">
          {profile.created ? (
            <Section title={t("created-title")} count={profile.created.length}>
              {profile.created.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : <PresenceCollection items={profile.created} />}
            </Section>
          ) : null}
          {profile.liked ? (
            <Section title={t("liked-title")} count={profile.liked.length}>
              {profile.liked.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : <PresenceCollection items={profile.liked} />}
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
};