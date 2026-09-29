import { useEffect, useMemo, useState } from "react"
import { RiCheckLine } from "@remixicon/react"
import { Button } from "@/ui/button"
import { PresenceIcon } from "@/components/shared/presence-icon"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/ui/cn"
import { formatCompact } from "@/lib/format"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { fromCatalog } from "@/lib/presence-view"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { OnboardingStepLayout } from "@/features/onboarding/onboarding-step-layout"

export const PresencesStep = ({ onNext }: { onNext: () => void }) => {
  const { t, locale } = useI18n()
  const { state, refresh } = useExtensionState()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    void refresh.catalog()
  }, [refresh])

  const popular = useMemo(
    () =>
      [...state.catalog.items]
        .sort((a, b) => (b.activeUsers ?? 0) * 10 + (b.totalInstalls ?? 0) - ((a.activeUsers ?? 0) * 10 + (a.totalInstalls ?? 0)))
        .slice(0, 9)
        .map((item) => fromCatalog(item, locale)),
    [state.catalog.items, locale],
  )

  const install = async () => {
    setInstalling(true)
    for (const slug of selected) {
      if (!state.presences[slug]) await sendMessage("INSTALL_PRESENCE_FROM_API", { slug }).catch(() => {})
    }
    await refresh.presences()
    setInstalling(false)
    onNext()
  }

  const count = [...selected].filter((slug) => !state.presences[slug]).length

  return (
    <OnboardingStepLayout
      title={t("onboarding.presencesTitle")}
      description={t("onboarding.presencesDescription")}
      footer={
        count > 0 ? (
          <Button onClick={() => void install()} loading={installing} className="w-full">
            {t("onboarding.installCount", { count })}
          </Button>
        ) : (
          <Button variant="secondary" onClick={onNext} className="w-full">
            {t("onboarding.later")}
          </Button>
        )
      }
    >
      {popular.length === 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {popular.map((view) => {
            const installed = Boolean(state.presences[view.slug])
            const active = installed || selected.has(view.slug)
            return (
              <button
                key={view.slug}
                type="button"
                disabled={installed}
                aria-pressed={active}
                onClick={() =>
                  setSelected((current) => {
                    const next = new Set(current)
                    if (next.has(view.slug)) next.delete(view.slug)
                    else next.add(view.slug)
                    return next
                  })
                }
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-sm border bg-surface px-2 pt-4 pb-3 text-center transition-colors",
                  active ? "border-primary" : "border-line hover:border-line-strong",
                )}
              >
                {active && (
                  <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-on-primary">
                    <RiCheckLine className="size-3" />
                  </span>
                )}
                <PresenceIcon slug={view.slug} name={view.name} color={view.color} size={40} />
                <span className="flex w-full flex-col">
                  <span className="truncate text-label-md font-medium">{view.name}</span>
                  <span className="truncate text-label-sm text-muted">{(view.activeUsers ?? 0) > 0 ? t("library.usersNow", { count: formatCompact(view.activeUsers, locale) }) : " "}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </OnboardingStepLayout>
  )
}
