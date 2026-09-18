import { getPrisma } from "@/db/client"

// Chrome Web Store developer dashboard doesn't expose these numbers through
// any API - this parses the CSVs manually exported from the dashboard.
// Each file's first line (its title, not the filename) identifies the report.
const REPORTS: Record<string, { metric: string; dimension: string }> = {
  "Installations": { metric: "installs", dimension: "total" },
  "Installations par langue": { metric: "installs", dimension: "language" },
  "Installations par région": { metric: "installs", dimension: "region" },
  "Installations par système d'exploitation": { metric: "installs", dimension: "os" },
  "Désinstallations": { metric: "uninstalls", dimension: "total" },
  "Désinstallations par langue": { metric: "uninstalls", dimension: "language" },
  "Désinstallations par région": { metric: "uninstalls", dimension: "region" },
  "Désinstallations par système d'exploitation": { metric: "uninstalls", dimension: "os" },
  "Utilisateurs quotidiens par version de l'élément": { metric: "active_users", dimension: "version" },
  "Utilisateurs hebdomadaires au fil du temps": { metric: "weekly_users", dimension: "total" },
  "Utilisateurs hebdomadaires par langue": { metric: "weekly_users", dimension: "language" },
  "Utilisateurs hebdomadaires par région": { metric: "weekly_users", dimension: "region" },
  "Utilisateurs hebdomadaires par système d'exploitation": { metric: "weekly_users", dimension: "os" },
  "Extension activé ou désactivée": { metric: "enabled_state", dimension: "state" },
  "Impressions pour l'ensemble du Chrome Web Store": { metric: "impressions", dimension: "total" },
  "Pages vues": { metric: "page_views", dimension: "total" },
  "Pages vues par source": { metric: "page_views", dimension: "source" },
  "Pages vues par support": { metric: "page_views", dimension: "device_type" },
  "Pages vues par campagne": { metric: "page_views", dimension: "campaign" },
  "Évolution des avis au fil du temps": { metric: "ratings", dimension: "stars" },
}

export type CwsStatRow = { date: Date; metric: string; dimension: string; dimensionValue: string; value: number }

// CWS exports dates as "DD/MM/YYYY".
const parseDate = (value: string): Date => {
  const [day, month, year] = value.split("/").map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

export const parseCwsCsv = (content: string): CwsStatRow[] => {
  const lines = content.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.length > 0)
  // CWS titles sometimes contain a non-breaking space (e.g. "Chrome Web Store").
  const title = (lines[0]?.trim() ?? "").replace(/ /g, " ")
  const report = REPORTS[title]
  if (!report) return []

  const columns = lines[1]?.split(",").slice(1) ?? []
  if (columns.length === 0) return []

  const rows: CwsStatRow[] = []
  for (const line of lines.slice(2)) {
    const [dateStr, ...values] = line.split(",")
    if (!dateStr) continue
    const date = parseDate(dateStr)
    values.forEach((raw, i) => {
      const value = Number(raw)
      if (!Number.isFinite(value)) return
      rows.push({
        date,
        metric: report.metric,
        dimension: columns.length === 1 ? "total" : report.dimension,
        dimensionValue: columns.length === 1 ? "total" : columns[i]!.trim(),
        value,
      })
    })
  }
  return rows
}

// Every import is a full "last 5 years" export from the CWS dashboard, so a
// full replace (rather than an incremental upsert) is the correct semantics.
export const replaceCwsStats = async (rows: CwsStatRow[]): Promise<{ cleared: number; inserted: number }> => {
  const prisma = getPrisma()
  const { count: cleared } = await prisma.cwsDailyStat.deleteMany({})
  if (rows.length > 0) await prisma.cwsDailyStat.createMany({ data: rows })
  return { cleared, inserted: rows.length }
}
