type Props = {
  title: string
  description?: string
  className?: string
  // When set, the title renders as a <label> bound to this control id
  // instead of a plain <p>, so clicking/tapping the text activates the
  // associated control.
  titleFor?: string
}

// Single source for the "title + description" text pair repeated across
// settings rows and inline notices - change the spacing/type scale once here
// instead of in every call site.
export const HeadingText = ({ title, description, className, titleFor }: Props): React.JSX.Element => (
  <div className={className}>
    {titleFor ? (
      <label htmlFor={titleFor} className="block cursor-pointer text-sm leading-tight font-medium text-foreground">
        {title}
      </label>
    ) : (
      <p className="text-sm leading-tight font-medium text-foreground">{title}</p>
    )}
    {description ? <p className="text-xs leading-4 text-muted-foreground">{description}</p> : null}
  </div>
)
