import { RiDiscordFill } from "@remixicon/react"

type Props = {
  size?: number
}

export const IdlePulse = ({ size = 56 }: Props): React.JSX.Element => (
  <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
    <span className="absolute inset-0 animate-ping rounded-full bg-accent/20 [animation-duration:2.4s]" />
    <span className="absolute inset-[15%] rounded-full bg-accent/10" />
    <span className="absolute inset-0 flex items-center justify-center rounded-full ring-1 ring-border bg-card">
      <RiDiscordFill className="size-1/2 text-muted-foreground" />
    </span>
  </div>
)
