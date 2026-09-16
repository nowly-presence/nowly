import { cn } from "@/lib/utils";

/** Figma: #E4F2FF at 1% */
export const homeSectionAltClass = "bg-[rgba(228,242,255,0.01)]";

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
};

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) => (
  <div className={cn(align === "center" ? "mx-auto max-w-[44rem] text-center" : "max-w-[38rem]", className)}>
    {eyebrow ? (
      <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
    ) : null}
    <h2 className="text-[26px] font-normal leading-tight text-foreground sm:text-[30px] lg:text-nowrap">{title}</h2>
    {description ? (
      <p className="mx-auto mt-2 max-w-[36rem] text-base leading-relaxed text-muted-foreground sm:text-lg lg:max-w-none lg:text-nowrap">
        {description}
      </p>
    ) : null}
  </div>
);
