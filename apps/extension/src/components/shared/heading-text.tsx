type Props = {
  title: string
  description?: string
  className?: string
}

// Single source for the "title + description" text pair repeated across
// settings rows and inline notices - change the spacing/type scale once here
// instead of in every call site.
export const HeadingText = ({ title, description, className }: Props): React.JSX.Element => (
  <div className={className}>
    <p className="text-sm leading-tight font-medium text-foreground">{title}</p>
    {description ? <p className="text-xs leading-4 text-muted-foreground">{description}</p> : null}
  </div>
)
