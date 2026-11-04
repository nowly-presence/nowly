import { describe, expect, it } from "vitest";
import { parseRichText, richTextToPlain } from "@/lib/rich-text";

describe("parseRichText", () => {
  it("keeps plain text and line breaks untouched", () => {
    expect(parseRichText("a\n\nb")).toEqual([
      {
        text: "a\n\nb",
        bold: false,
        italic: false,
        underline: false
      }
    ]);
  });

  it("parses bold, italic and underline", () => {
    const segments = parseRichText("x **b** *i* __u__ y");
    expect(segments.filter((segment) => segment.bold).map((segment) => segment.text)).toEqual(["b"]);
    expect(segments.filter((segment) => segment.italic).map((segment) => segment.text)).toEqual(["i"]);
    expect(segments.filter((segment) => segment.underline).map((segment) => segment.text)).toEqual(["u"]);
    expect(richTextToPlain(segments)).toBe("x b i u y");
  });

  it("nests styles", () => {
    const segments = parseRichText("**a *b***");
    expect(segments.some((segment) => segment.bold && segment.italic && segment.text === "b")).toBe(true);
  });

  it("leaves unmatched markers as literal text", () => {
    expect(richTextToPlain(parseRichText("2 * 3 and **open"))).toBe("2 * 3 and **open");
  });
});