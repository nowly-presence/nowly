import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { IconMapPin, IconUsers } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { TeamSocialLinks } from "./team-social-links";
import type { GithubProfile, SocialLink, TeamMember } from "@/features/team/types";

type Props = {
  member: TeamMember
  profile: GithubProfile | null
  socials: SocialLink[]
  labels: {
    emptyBio: string
    followers: string
    following: string
  }
};

const formatNumber = (n: number): string => n.toLocaleString("en-US");

export const TeamMemberCard: FC<Props> = ({ member, profile, socials, labels }): ReactElement => {
  const name = profile?.name || profile?.login || member.github;
  const login = profile?.login || member.github;
  const avatar = profile?.avatar_url ?? `https://github.com/${member.github}.png?size=192`;
  const bio = profile?.bio || labels.emptyBio;

  return (
    <Card
      size="sm"
      className="bg-linear-to-br from-accent/20 via-card to-card"
    >
      <CardContent className="space-y-5">
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <Avatar className="size-20! rounded-lg ring-2 ring-border/60 md:size-28!" size="lg">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{member.fallback}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="max-w-full truncate text-lg font-semibold text-foreground md:text-2xl">
              {name}
            </h2>

            <p className="max-w-full truncate text-sm text-accent">@{login}</p>

            {profile?.location ? (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                <IconMapPin className="size-3.5 shrink-0" />
                <span className="truncate">{profile.location}</span>
              </p>
            ) : null}

            {profile ? (
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <IconUsers className="size-3.5 shrink-0" />
                <span>{formatNumber(profile.followers)} {labels.followers}</span>
                <span className="size-1 rounded-full bg-border shrink-0" />
                <span>{formatNumber(profile.following)} {labels.following}</span>
              </p>
            ) : null}
          </div>
        </div>

        <p className="w-full rounded-md text-sm leading-relaxed text-muted-foreground">{bio}</p>

        <TeamSocialLinks links={socials} />
      </CardContent>
    </Card>
  );
};