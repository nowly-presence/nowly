import { describe, expect, it } from "vitest";
import { highlightCode } from "@/lib/highlight";

describe("highlightCode", () => {
  it("keeps the source intact", () => {
    const source = 'const presence = new Presence()\npresence.on("UpdateData", async () => {\n  const url = `${a}/b`\n})\n';
    expect(
      highlightCode(source, "ts")
        .map((token) => token.text)
        .join("")
    ).toBe(source);
  });

  it("colours keywords, names and strings in TypeScript", () => {
    const tokens = highlightCode('const data = await presence.getStrings("x")', "ts");
    expect(tokens).toContainEqual({
      kind: "keyword",
      text: "await"
    });
    expect(tokens).toContainEqual({
      kind: "name",
      text: "presence"
    });
    expect(tokens).toContainEqual({
      kind: "string",
      text: '"x"'
    });
    expect(tokens.find((token) => token.text.includes("const"))?.kind).toBe("plain");
  });

  it("tells JSON keys from values", () => {
    const tokens = highlightCode('{ "name": "Example", "count": 2, "ok": true }', "json");
    expect(tokens).toContainEqual({
      kind: "name",
      text: '"name"'
    });
    expect(tokens).toContainEqual({
      kind: "string",
      text: '"Example"'
    });
    expect(tokens.filter((token) => token.kind === "literal").map((token) => token.text)).toEqual(["2", "true"]);
  });
});