import { RiStarFill } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useFeatureReveals } from "@/hooks/feature-reveal-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { openUrl, storeReviews } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { Sheet } from "@/ui/sheet"
import { useReviewPrompt } from "@/features/review/use-review-prompt"

const STARS = 5

export const ReviewPrompt = () => {
  const { state } = useExtensionState()
  const { t } = useI18n()
  const { stack } = useNav()
  const { activeId } = useFeatureReveals()
  const eligible = state.ready && Object.keys(state.presences).length > 0 && stack.length === 0 && activeId === null
  const { open, dismiss } = useReviewPrompt(eligible)
  const { store, url } = storeReviews()

  const rate = () => {
    openUrl(url)
    dismiss()
  }

  return (
    <Sheet
      open={open}
      onClose={dismiss}
      title={t("review.title")}
      description={t("review.description", { store })}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={dismiss}>
            {t("review.dismiss")}
          </Button>
          <Button className="flex-1" icon={<RiStarFill className="size-4" />} onClick={rate}>
            {t("review.rate")}
          </Button>
        </>
      }
    >
      <div className="flex justify-center gap-1.5 py-3 text-primary" aria-hidden>
        {Array.from({ length: STARS }, (_, index) => (
          <RiStarFill key={index} className="size-8" />
        ))}
      </div>
    </Sheet>
  )
}
