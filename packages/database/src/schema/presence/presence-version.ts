import { boolean, foreignKey, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { presence } from "@nowly/database/schema/presence/presence";

export const presenceVersion = pgTable(
  "presence_versions",
  {
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    changelog: text("changelog").default("").notNull(),
    author: text("author").default("unknown").notNull(),
    authorGithub: text("author_github"),
    releaseAuthor: text("release_author"),
    releaseContributors: text("release_contributors"),
    pr: text("pr"),
    source: text("source"),
    commitSha: text("commit_sha"),
    changedFiles: text("changed_files"),
    bundleSizeBytes: integer("bundle_size_bytes"),
    bundleSizeLabel: text("bundle_size_label"),
    bundleSha256: text("bundle_sha256"),
    versionType: text("version_type"),
    aiGeneratedChangelog: boolean("ai_generated_changelog"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    timestamp: timestamp("timestamp", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({
      name: "presence_versions_pkey",
      columns: [table.slug, table.version]
    }),
    index("presence_versions_slug_idx").on(table.slug),
    foreignKey({
      name: "presence_versions_slug_fkey",
      columns: [table.slug],
      foreignColumns: [presence.slug]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);