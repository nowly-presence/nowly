/**
 * Deterministic JSON serialization: object keys are sorted and `undefined`
 * values are dropped, so the same logical value always produces the same
 * string. Used on both sides of presence signature verification (API signs,
 * extension verifies) - the algorithm MUST stay byte-for-byte identical.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`

  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`
}
