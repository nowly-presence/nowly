import { ButtonAnchor } from "@nowly/ui";

import { docsHref } from "@/lib/seo";
import { RiArrowRightLine } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

const kw = "text-accent";
const fn = "text-foreground";
const str = "text-foreground/55";
const muted = "text-muted-foreground";

export const OpenSourceSection = async () => {
  const t = await getTranslations("open-source");

  return (
    <section className="px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-pretty text-[26px] font-normal leading-tight text-foreground sm:text-[2.15rem]">
            {t("title")}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>
          <div className="mt-8">
            <ButtonAnchor
              href={docsHref("/presence-development/creating-your-first-presence")}
              rel="noreferrer"
              target="_blank"
              variant="inverted"
            >
              {t("docs")}
              <RiArrowRightLine data-icon="inline-end" />
            </ButtonAnchor>
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] bg-code-surface shadow-[0_0_0_1px_var(--border)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="size-2 rounded-full bg-foreground/20" />
            <span className="size-2 rounded-full bg-foreground/20" />
            <span className="size-2 rounded-full bg-foreground/20" />
            <span className="ml-2 font-mono text-[11px] tracking-wide text-muted-foreground">{t("file")}</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.7] sm:text-sm">
            <code>
              <span className={muted}>{"const "}</span>
              <span className={fn}>presence</span>
              <span className={muted}>{" = "}</span>
              <span className={kw}>new</span>
              <span className={muted}>{" "}</span>
              <span className={fn}>Presence</span>
              <span className={muted}>{"()"}</span>
              {"\n\n"}
              <span className={fn}>presence</span>
              <span className={muted}>.</span>
              <span className={fn}>on</span>
              <span className={muted}>{"("}</span>
              <span className={str}>{'"UpdateData"'}</span>
              <span className={muted}>{", async () => {"}</span>
              {"\n"}
              <span className={muted}>{"  await "}</span>
              <span className={fn}>presence</span>
              <span className={muted}>.</span>
              <span className={fn}>setActivity</span>
              <span className={muted}>{"({"}</span>
              {"\n"}
              <span className={fn}>{"    details"}</span>
              <span className={muted}>{": "}</span>
              <span className={fn}>document</span>
              <span className={muted}>.</span>
              <span className={fn}>title</span>
              <span className={muted}>,</span>
              {"\n"}
              <span className={fn}>{"    largeImageKey"}</span>
              <span className={muted}>{": "}</span>
              <span className={fn}>Assets</span>
              <span className={muted}>.</span>
              <span className={fn}>Logo</span>
              <span className={muted}>,</span>
              {"\n"}
              <span className={muted}>{"  })"}</span>
              {"\n"}
              <span className={muted}>{"})"}</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
};
