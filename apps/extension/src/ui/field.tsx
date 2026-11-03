import { createContext, useContext, useId, type AriaAttributes, type ReactNode } from "react";
import { cn } from "@/ui/cn";

type FieldIds = {
  labelId: string;
  hintId?: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldIds | null>(null);

export const useFieldIds = () => useContext(FieldContext);

export const fieldAria = (field: FieldIds | null, props: Pick<AriaAttributes, "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-invalid">) => ({
  "aria-labelledby": props["aria-labelledby"] ?? (props["aria-label"] ? undefined : field?.labelId),
  "aria-describedby": props["aria-describedby"] ?? field?.hintId,
  "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined)
});

type FieldProps = {
  label: string;
  hint?: string;
  optional?: string;
  action?: ReactNode;
  invalid?: boolean;
  className?: string;
  children: ReactNode;
};

export const Field = ({ label, hint, optional, action, invalid = false, className, children }: FieldProps) => {
  const id = useId();
  const ids: FieldIds = {
    labelId: `${id}-label`,
    hintId: hint ? `${id}-hint` : undefined,
    invalid
  };
  return (
    <FieldContext.Provider value={ids}>
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span id={ids.labelId} className="text-label-lg font-medium">
              {label}
              {optional && <span className="font-normal text-muted"> ({optional})</span>}
            </span>
            {action}
          </div>
          {hint && (
            <span id={ids.hintId} className="text-label-md text-muted">
              {hint}
            </span>
          )}
        </div>
        {children}
      </div>
    </FieldContext.Provider>
  );
};