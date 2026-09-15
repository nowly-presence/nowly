import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FC, ReactElement, ReactNode } from "react";

export type TypeProperty = {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
};

export type LanguageEntry = {
  language: string;
  code: string;
  default?: boolean;
};

export type ApiMethod = {
  method: string;
  description: string;
  returns: string;
};

export type ErrorEntry = {
  status: string;
  error: string;
  solution: string;
};

type DataTableProps =
  | { variant: "type"; data?: TypeProperty[]; className?: string }
  | { variant: "language"; data?: LanguageEntry[]; className?: string }
  | { variant: "api"; data?: ApiMethod[]; className?: string }
  | { variant: "error"; data?: ErrorEntry[]; className?: string };

const EmptyCell: FC = (): ReactElement => (
  <span className="text-muted-foreground/50">-</span>
);

const InlineCode: FC<{ children: ReactNode }> = ({ children }): ReactElement => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
    {children}
  </code>
);

const TypeValue: FC<{ type: string }> = ({ type }): ReactElement => (
  <span className="font-medium text-foreground">{type}</span>
);

const tableConfigs = {
  type: {
    headers: ["Field", "Type", "Description", "Default"],
    renderRow: (prop: TypeProperty): ReactElement => (
      <tr
        key={prop.name}
        className="border-b border-border last:border-0 even:bg-muted/20"
      >
        <td className="border-r border-border px-4 py-3 align-top">
          <InlineCode>
            {prop.name}
            {prop.required ? (
              <span className="ml-0.5 text-destructive">*</span>
            ) : null}
          </InlineCode>
        </td>

        <td className="border-r border-border px-4 py-3 align-top">
          <TypeValue type={prop.type} />
        </td>

        <td className="border-r border-border px-4 py-3 align-top text-foreground">
          {prop.description || <EmptyCell />}
        </td>

        <td className="px-4 py-3 align-top">
          {prop.defaultValue ? (
            <InlineCode>{prop.defaultValue}</InlineCode>
          ) : (
            <EmptyCell />
          )}
        </td>
      </tr>
    ),
  },

  language: {
    headers: ["Language", "Code", "Default"],
    renderRow: (lang: LanguageEntry): ReactElement => (
      <tr
        key={lang.code}
        className="border-b border-border last:border-0 even:bg-muted/20"
      >
        <td className="border-r border-border px-4 py-3 font-medium text-foreground">
          {lang.language}
        </td>

        <td className="border-r border-border px-4 py-3">
          <InlineCode>{lang.code}</InlineCode>
        </td>

        <td className="px-4 py-3">
          {lang.default ? (
            <span className="font-medium text-primary">Yes</span>
          ) : (
            <span className="text-muted-foreground/70">—</span>
          )}
        </td>
      </tr>
    ),
  },

  api: {
    headers: ["Method", "Description", "Returns"],
    renderRow: (method: ApiMethod): ReactElement => (
      <tr
        key={method.method}
        className="border-b border-border last:border-0 even:bg-muted/20"
      >
        <td className="border-r border-border px-4 py-3 align-top">
          <InlineCode>{method.method}()</InlineCode>
        </td>

        <td className="border-r border-border px-4 py-3 align-top text-foreground">
          {method.description}
        </td>

        <td className="px-4 py-3 align-top">
          <TypeValue type={method.returns} />
        </td>
      </tr>
    ),
  },

  error: {
    headers: ["Status", "Error", "Solution"],
    renderRow: (error: ErrorEntry): ReactElement => (
      <tr
        key={`${error.status}-${error.error}`}
        className="border-b border-border last:border-0 even:bg-muted/20"
      >
        <td className="border-r border-border px-4 py-3 align-top">
          <Badge variant="destructive" className="font-mono text-xs">
            {error.status}
          </Badge>
        </td>

        <td className="border-r border-border px-4 py-3 align-top font-medium text-foreground">
          {error.error}
        </td>

        <td className="px-4 py-3 align-top text-foreground">
          {error.solution}
        </td>
      </tr>
    ),
  },
} as const;

export const DataTable: FC<DataTableProps> = ({ variant, data }): ReactElement => {
  const config = tableConfigs[variant];
  const rows = data ?? [];

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {config.headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-3 text-left text-sm font-semibold text-muted-foreground", {
                    "border-r border-border": index < config.headers.length - 1
                  }
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((item) => config.renderRow(item as never))
          ) : (
            <tr>
              <td
                colSpan={config.headers.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const TypeTable: FC<{
  properties?: TypeProperty[];
  className?: string;
}> = ({ properties, className }): ReactElement => (
  <DataTable variant="type" data={properties} className={className} />
);

export const LanguageTable: FC<{
  languages: LanguageEntry[];
  className?: string;
}> = ({ languages, className }): ReactElement => (
  <DataTable variant="language" data={languages} className={className} />
);

export const ApiMethodTable: FC<{
  methods: ApiMethod[];
  className?: string;
}> = ({ methods, className }): ReactElement => (
  <DataTable variant="api" data={methods} className={className} />
);

export const ErrorTable: FC<{
  errors: ErrorEntry[];
  className?: string;
}> = ({ errors, className }): ReactElement => (
  <DataTable variant="error" data={errors} className={className} />
);