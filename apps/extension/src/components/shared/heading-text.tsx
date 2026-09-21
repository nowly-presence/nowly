type Props = {
  title: string
  description?: string
  className?: string
  titleFor?: string
}

export const HeadingText = ({ title, description, className, titleFor }: Props): React.JSX.Element => (
  <div className={className}>
    {titleFor ? (
      <label
        htmlFor={titleFor}
        className="block cursor-pointer text-sm leading-tight font-medium text-foreground"
      >
        {title}
      </label>
    ) : (
      <p className="text-sm leading-tight font-medium text-foreground">{title}</p>
    )}
    {description ? <p className="text-xs leading-4 text-muted-foreground">{description}</p> : null}
  </div>
)
