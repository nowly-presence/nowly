import { t } from "@/shared/i18n"

type Person = {
  github?: string
  name: string
}

type Props = {
  author?: Person
  contributors?: Person[]
}

const PersonPill = ({ label, person }: { label: string; person: Person }): React.JSX.Element => {
  const avatarUrl = person.github ? `https://github.com/${person.github}.png?size=48` : null
  const initial = person.name.trim().charAt(0).toUpperCase() || "?"
  const content = (
    <>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
          {initial}
        </span>
      )}
      <span className="min-w-0 truncate text-[11px] font-medium text-foreground">{person.name}</span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </>
  )

  if (!person.github)
    return <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary/50 px-2 py-1">{content}</span>

  return (
    <button
      type="button"
      onClick={() => void chrome.tabs.create({ url: `https://github.com/${person.github}` })}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary/50 px-2 py-1 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </button>
  )
}

export const PresenceCreditsPills = ({ author, contributors = [] }: Props): React.JSX.Element | null => {
  if (!author?.name) return null

  const people = [
    { person: author, label: t("presence-author-label") },
    ...contributors
      .filter((person) => person.name && person.name !== author.name)
      .map((person) => ({ person, label: t("presence-contributor-label") })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("presence-credits")}</h2>
      <div className="flex flex-wrap gap-2">
        {people.map(({ label, person }) => (
          <PersonPill
            key={person.github ?? person.name}
            label={label}
            person={person}
          />
        ))}
      </div>
    </div>
  )
}
