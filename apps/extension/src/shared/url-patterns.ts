export const toMatchPatterns = (urls: string[]): string[] => {
  const patterns = new Set<string>()

  for (const rawUrl of urls) {
    const raw = rawUrl.trim()
    if (!raw) continue

    if (raw.includes("://")) {
      const withPath = raw.endsWith("/*") || raw.includes("/", raw.indexOf("://") + 3) ? raw : `${raw}/*`
      patterns.add(withPath)
      continue
    }

    const host = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (host === "*" || host === "*.*" || host === "<all_urls>") continue
    patterns.add(`*://${host}/*`)

    if (!host.startsWith("*.") && !host.startsWith("*.")) {
      patterns.add(`*://*.${host}/*`)
    }
  }

  return [...patterns]
}

const patternParts = (pattern: string): { scheme: string; host: string; path: string } | null => {
  const match = pattern.match(/^(https?|\*):\/\/([^/]+)(\/.*)$/)
  if (!match) return null
  return { scheme: match[1], host: match[2], path: match[3] }
}

const hostMatches = (patternHost: string, hostname: string): boolean => {
  if (patternHost === "*") return true
  if (patternHost.startsWith("*.")) {
    const suffix = patternHost.slice(2)
    return hostname === suffix || hostname.endsWith(`.${suffix}`)
  }
  return hostname === patternHost
}

const pathMatches = (patternPath: string, pathname: string): boolean => {
  if (patternPath === "/*" || patternPath === "*") return true
  if (patternPath.endsWith("*")) {
    const prefix = patternPath.slice(0, -1)
    return pathname.startsWith(prefix) || `${pathname}/`.startsWith(prefix)
  }
  return pathname === patternPath
}

export const urlMatchesPattern = (href: string, pattern: string): boolean => {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }

  const parts = patternParts(pattern)
  if (!parts) return false
  if (parts.scheme !== "*" && url.protocol !== `${parts.scheme}:`) return false
  if (!hostMatches(parts.host, url.hostname)) return false
  return pathMatches(parts.path, url.pathname)
}

export const urlMatchesPresence = (href: string, urls: string[] | undefined): boolean => {
  if (!urls?.length) return false
  return toMatchPatterns(urls).some((pattern) => urlMatchesPattern(href, pattern))
}
