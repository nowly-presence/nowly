#!/usr/bin/env node
import { minifyVersionBundlesOnR2, optimizeAssetsOnR2, uploadAllToR2, uploadHostReleaseToR2 } from "@nowly/websites/cli/r2"
import { registerPush } from "@nowly/websites/cli/commands/push"
import { logger } from "@nowly/websites/cli/logger"
import { confirm, select } from "@nowly/websites/cli/prompts"
import { existsSync } from "fs"
import { resolve } from "path"
import chalk from "chalk"
import { Command } from "commander"
import "dotenv/config"

const program = new Command()
  .name("internal-cli")
  .description("Nowly admin CLI — internal commands for releases, CDN sync, and publishing")
  .version("1.0.0")

registerPush(program)

program
  .command("r2:sync")
  .description("Upload built presence assets and bundles to Cloudflare R2")
  .argument("[slug]", "Presence slug (optional — syncs all if omitted)")
  .action(async (slug?: string) => {
    logger.newline()
    logger.title("✦ Sync to Cloudflare R2")

    try {
      if (slug) {
        const { uploadToR2 } = await import("@nowly/websites/cli/r2")
        const urls = await uploadToR2(slug)
        logger.newline()
        for (const url of urls) logger.success(url)
      } else {
        await uploadAllToR2()
      }
      logger.newline()
      logger.success("R2 sync complete")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

program
  .command("r2:minify-version-bundles")
  .description("Minify historical R2 presence bundles under presences/*/versions/*/bundle.js")
  .argument("[slug]", "Presence slug (optional — scans all if omitted)")
  .option("--simulate", "Only print storage stats without modifying R2")
  .action(async (slug: string | undefined, options: { simulate?: boolean }) => {
    logger.newline()
    logger.title(options.simulate ? "✦ Simulate R2 versioned bundle minification" : "✦ Minify R2 versioned presence bundles")

    try {
      const result = await minifyVersionBundlesOnR2({
        dryRun: options.simulate === true,
        slug,
      })
      const safeSavedBytes = result.originalBytes - result.minifiedBytes
      const netSavedBytes = result.totalOriginalBytes - result.totalMinifiedBytes

      logger.newline()
      logger.success(`${result.scanned} versioned bundle${result.scanned > 1 ? "s" : ""} scanned`)
      logger.success(`${result.changed} bundle${result.changed > 1 ? "s" : ""} ${options.simulate ? "would shrink" : "minified"}`)
      if (result.larger > 0) logger.warning(`${result.larger} would grow and should be skipped`)
      if (result.unchanged > 0) logger.info(`${result.unchanged} unchanged`)
      if (result.failed > 0) logger.warning(`${result.failed} failed`)
      logger.info(`Current scanned size: ${(result.totalOriginalBytes / 1024).toFixed(1)} kB`)
      logger.info(`Minified theoretical size: ${(result.totalMinifiedBytes / 1024).toFixed(1)} kB`)
      logger.success(`Safe saving if only smaller bundles are overwritten: ${(safeSavedBytes / 1024).toFixed(1)} kB`)
      logger.info(`Net delta if every bundle were overwritten: ${(netSavedBytes / 1024).toFixed(1)} kB`)
      if (options.simulate) logger.warning("Simulation only. No R2 object was modified.")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

program
  .command("r2:optimize-assets")
  .description("Optimize presence image assets on R2")
  .argument("[slug]", "Presence slug (optional — scans all if omitted)")
  .option("--simulate", "Only print storage stats without modifying R2")
  .action(async (slug: string | undefined, options: { simulate?: boolean }) => {
    logger.newline()
    logger.title(options.simulate ? "✦ Simulate R2 presence asset optimization" : "✦ Optimize R2 presence assets")

    try {
      const result = await optimizeAssetsOnR2({
        dryRun: options.simulate === true,
        slug,
      })
      const savedBytes = result.shrinkableOriginalBytes - result.shrinkableOptimizedBytes
      const netSavedBytes = result.originalBytes - result.optimizedBytes

      logger.newline()
      logger.success(`${result.scanned} asset${result.scanned > 1 ? "s" : ""} scanned`)
      logger.success(`${result.shrinkable} asset${result.shrinkable > 1 ? "s" : ""} ${options.simulate ? "would shrink" : "optimized"}`)
      if (result.larger > 0) logger.warning(`${result.larger} would grow and should be skipped`)
      if (result.unchanged > 0) logger.info(`${result.unchanged} unchanged`)
      if (result.invalidDimensions > 0) logger.warning(`${result.invalidDimensions} skipped because dimensions are not expected`)
      if (result.failed > 0) logger.warning(`${result.failed} failed`)
      logger.info(`Current optimizable size: ${(result.originalBytes / 1024).toFixed(1)} kB`)
      logger.info(`Optimized theoretical size: ${(result.optimizedBytes / 1024).toFixed(1)} kB`)
      logger.success(`Safe saving if only smaller assets are overwritten: ${(savedBytes / 1024).toFixed(1)} kB`)
      logger.info(`Net delta if every valid asset were overwritten: ${(netSavedBytes / 1024).toFixed(1)} kB`)
      if (options.simulate) logger.warning("Simulation only. No R2 object was modified.")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

program
  .command("host:publish")
  .description("Upload Nowly Host release artifacts to Cloudflare R2")
  .requiredOption("--release-version <version>", "Host release version")
  .option("--installer <path>", "Path to nowly setup executable")
  .option("--portable <path>", "Path to Windows portable zip archive")
  .option("--linux <path>", "Path to Linux tar.gz archive")
  .option("--macos <path>", "Path to macOS tar.gz archive")
  .option("--macos-dmg <path>", "Path to macOS DMG disk image")
  .action(async (options: { releaseVersion: string; installer?: string; portable?: string; linux?: string; macos?: string; macosDmg?: string }) => {
    const resolveArtifactPath = (path: string | undefined): string | undefined => {
      if (!path) return undefined
      const fromCurrent = resolve(path)
      if (existsSync(fromCurrent)) return fromCurrent
      const fromRoot = resolve(process.cwd(), "../..", path)
      if (existsSync(fromRoot)) return fromRoot
      return fromCurrent
    }

    if (!options.installer && !options.portable && !options.linux && !options.macos && !options.macosDmg) {
      logger.error("at least one artifact (--installer, --portable, --linux, --macos, --macos-dmg) is required")
      process.exit(1)
    }

    logger.newline()
    logger.title("Host release publish")

    try {
      const manifest = await uploadHostReleaseToR2(
        options.releaseVersion,
        resolveArtifactPath(options.installer),
        resolveArtifactPath(options.portable),
        resolveArtifactPath(options.linux),
        resolveArtifactPath(options.macos),
        resolveArtifactPath(options.macosDmg),
      )
      logger.success(`Published host v${manifest.version}`)
      if (manifest.windows?.installer) logger.success(manifest.windows.installer.url)
      if (manifest.windows?.portable) logger.success(manifest.windows.portable.url)
      if (manifest.linux) logger.success(manifest.linux.archive.url)
      if (manifest.macos?.archive) logger.success(manifest.macos.archive.url)
      if (manifest.macos?.dmg) logger.success(manifest.macos.dmg.url)
      logger.success("Published installer/latest.json")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

const showInteractive = async () => {
  logger.newline()
  logger.raw(chalk.cyan(chalk.bold("  ⚡ Nowly Admin CLI")))
  logger.raw(chalk.dim(`  ${"─".repeat(40)}`))
  logger.newline()

  const action = await select("What would you like to do?", [
    { name: "push" as any, message: "Build and push presence(s) to API" },
    { name: "r2:sync" as any, message: "Upload presence assets to CDN" },
    { name: "r2:minify-version-bundles" as any, message: "Minify historical versioned bundles on R2" },
    { name: "r2:optimize-assets" as any, message: "Optimize image assets on R2" },
    { name: "host:publish" as any, message: "Publish Nowly Host release" },
    { name: "exit" as any, message: "Exit" },
  ])

  logger.newline()

  switch (action) {
    case "push":
      await program.parseAsync(["push"], { from: "user" })
      break
    case "r2:sync":
      await program.parseAsync(["r2:sync"], { from: "user" })
      break
    case "r2:minify-version-bundles":
      await program.parseAsync(["r2:minify-version-bundles"], { from: "user" })
      break
    case "r2:optimize-assets":
      await program.parseAsync(["r2:optimize-assets"], { from: "user" })
      break
    case "host:publish":
      logger.info("Run: pnpm internal-cli host:publish --release-version <version> [options]")
      logger.newline()
      break
    case "exit":
      logger.info("Goodbye! 👋")
      process.exit(0)
  }

  logger.newline()
  const again = await confirm("Do something else?", true)
  if (again) await showInteractive()
  else logger.info("Goodbye! 👋")
}

const main = async () => {
  if (process.argv.length <= 2) {
    await showInteractive()
  } else {
    await program.parseAsync()
  }
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
