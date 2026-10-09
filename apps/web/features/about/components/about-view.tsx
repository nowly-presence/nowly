import { ButtonLink } from "@/components/button-link";
import { Link } from "@/i18n/navigation";
import { getPresenceCatalog } from "@/lib/presence-api";
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardTitle } from "@nowly/ui";
import { RiArrowRightLine, RiGithubLine } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

type Section = { title: string; body: string };

const TEAM = [
  { name: "Gaëtan H", github: "Steellgold" },
  { name: "KiMi", github: "q-kimi" },
] as const;

const githubAvatar = (github: string): string => `https://github.com/${encodeURIComponent(github)}.png?size=80`;

export const AboutView = async () => {
  const [t, catalog] = await Promise.all([getTranslations("aboutPage"), getPresenceCatalog().catch(() => [])]);
  const sections = t.raw("sections") as Section[];
  const facts = [
    ...(catalog.length > 0 ? [t("facts.presences", { count: catalog.length })] : []),
    t("facts.languages"),
    t("facts.systems"),
    t("facts.browsers"),
    t("facts.launch"),
    t("facts.origin"),
  ];

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-2xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">{t("description")}</p>
        </header>

        <div className="mt-16 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:gap-16">
          <div className="max-w-3xl space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-[1.45rem] font-medium leading-snug tracking-tight text-foreground">{section.title}</h2>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-foreground/78">{section.body}</p>
              </section>
            ))}
            <div className="flex flex-wrap gap-3 border-t border-border pt-8">
              <ButtonLink href="/support#contact" variant="inverted">
                {t("links.contact")}
                <RiArrowRightLine data-icon="inline-end" />
              </ButtonLink>
              <ButtonLink href="/roadmap" variant="outline">{t("links.roadmap")}</ButtonLink>
              <ButtonLink href="/changelog" variant="outline">{t("links.changelog")}</ButtonLink>
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-32">
            <Card size="sm">
              <CardContent>
                <CardTitle>{t("facts.title")}</CardTitle>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  {facts.map((fact) => (
                    <li key={fact} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-4">
                <CardTitle>{t("team.title")}</CardTitle>
                {TEAM.map((member) => (
                  <a
                    key={member.github}
                    href={`https://github.com/${member.github}`}
                    rel="noreferrer"
                    target="_blank"
                    className="flex items-center gap-3 rounded-lg outline-offset-4"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={githubAvatar(member.github)} alt={member.name} />
                      <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{member.name}</span>
                      <span className="block text-xs text-muted-foreground">@{member.github}</span>
                    </span>
                    <RiGithubLine className="size-4 text-muted-foreground" />
                  </a>
                ))}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.rich("team.community", {
                    link: (chunks) => (
                      <Link href="/library" className="underline underline-offset-4 transition-colors hover:text-foreground">
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
