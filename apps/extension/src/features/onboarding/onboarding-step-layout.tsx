import { type ReactNode } from "react"

export const OnboardingStepLayout = ({ icon, title, description, children, footer }: { icon?: ReactNode; title: ReactNode; description: string; children?: ReactNode; footer: ReactNode }) => (
  <>
    <div className="flex flex-1 flex-col gap-6 pt-4">
      <div className="flex flex-col gap-3">
        {icon && <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">{icon}</span>}
        <h1 className="text-headline-sm font-medium tracking-[-0.3px] text-balance">{title}</h1>
        <p className="text-body-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-canvas px-4 pt-4 pb-1">{footer}</div>
  </>
)
