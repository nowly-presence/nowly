"use client";

import { Badge, cn } from "@nowly/ui";


import type { FC, ReactElement, ReactNode } from "react";
import { useTranslations } from "next-intl";

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
  defaultLabel?: string;
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
             <span className="font-medium text-primary">{lang.defaultLabel}</span>
          ) : (
            <span className="text-muted-foreground/70">-</span>
          )}
        </td>
      </tr>
    ),
  },

  api: {
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
  const t = useTranslations("docsUi");
  const config = tableConfigs[variant];
  const rows = data ?? [];
  const headers = {
    type: [t("field"), t("type"), t("description"), t("default")],
    language: [t("language"), t("code"), t("default")],
    api: [t("method"), t("description"), t("returns")],
    error: [t("status"), t("error"), t("solution")],
  }[variant];

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-3 text-left text-sm font-semibold text-muted-foreground", {
                     "border-r border-border": index < headers.length - 1
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
             rows.map((item) => config.renderRow(
               (variant === "language" ? { ...item, defaultLabel: t("yes") } : item) as never,
             ))
          ) : (
            <tr>
              <td
                 colSpan={headers.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                 {t("no-data")}
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
