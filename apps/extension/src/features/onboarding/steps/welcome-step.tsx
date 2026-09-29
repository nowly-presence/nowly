import { useMemo } from "react"
import { RiArrowRightLine } from "@remixicon/react"
import { Button } from "@/ui/button"
import { HeroStack } from "@/features/onboarding/hero-stack"
import { PresenceIcon } from "@/components/shared/presence-icon"
import { useI18n } from "@/hooks/i18n-provider"
import { fromCatalog } from "@/lib/presence-view"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { OnboardingStepLayout } from "@/features/onboarding/onboarding-step-layout"

export const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
  const { t, locale } = useI18n()
  const { state } = useExtensionState()
  const views = useMemo(
    () => [...state.catalog.items].sort((a, b) => (b.activeUsers ?? 0) - (a.activeUsers ?? 0)).map((item) => fromCatalog(item, locale)),
    [state.catalog.items, locale],
  )

  return (
    <OnboardingStepLayout
      title={
        <>
          {t("onboarding.welcomeTitleA")} <span className="text-primary">{t("onboarding.welcomeTitleB")}</span>
        </>
      }
      description={t("onboarding.welcomeDescription")}
      footer={
        <Button onClick={onNext} className="w-full" icon={<RiArrowRightLine className="order-last size-4" />}>
          {t("onboarding.getStarted")}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6 py-2">
        <HeroStack views={views} t={t} />
        {views.length > 0 && (
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex -space-x-2">
              {views.slice(0, 5).map((view) => (
                <PresenceIcon key={view.slug} slug={view.slug} name={view.name} color={view.color} size={24} rounded="rounded-full" className="ring-2 ring-canvas" />
              ))}
            </div>
            <span className="text-label-md text-muted">{t("onboarding.supported", { count: views.length })}</span>
          </div>
        )}
      </div>
    </OnboardingStepLayout>
  )
}
