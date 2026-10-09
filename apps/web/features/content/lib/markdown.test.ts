import { describe, expect, it } from "vitest";

import { parseFrontmatter } from "./frontmatter";
import { frenchSpacing, inlineText, mapBlockText, markdownHeadings, markdownWordCount, parseInline, parseMarkdown } from "./markdown";

describe("parseInline", () => {
  it("reads bold, code and links, and leaves the rest as text", () => {
    expect(parseInline("Open **Settings** then `chrome://extensions` or [the library](/library).")).toEqual([
      { kind: "text", text: "Open " },
      { kind: "strong", children: [{ kind: "text", text: "Settings" }] },
      { kind: "text", text: " then " },
      { kind: "code", text: "chrome://extensions" },
      { kind: "text", text: " or " },
      { kind: "link", href: "/library", children: [{ kind: "text", text: "the library" }] },
      { kind: "text", text: "." },
    ]);
  });

  it("keeps unbalanced markers as plain text", () => {
    expect(inlineText(parseInline("2 * 3 and a ` tick"))).toBe("2 * 3 and a ` tick");
  });
});

describe("parseMarkdown", () => {
  it("parses headings with unique ids, lists, notes, code and tables", () => {
    const blocks = parseMarkdown([
      "## Step 1: install",
      "",
      "Some text",
      "on two lines.",
      "",
      "- first",
      "- second",
      "  continued",
      "",
      "1. one",
      "2. two",
      "",
      "> **Note:** careful",
      "",
      "```bash",
      "sudo dpkg -i nowly-host.deb",
      "```",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | **2** |",
      "",
      "## Step 1: install",
    ].join("\n"));

    expect(blocks.map((block) => block.kind)).toEqual(["heading", "paragraph", "list", "list", "note", "code", "table", "heading"]);
    expect(markdownHeadings(blocks).map((heading) => heading.id)).toEqual(["step-1-install", "step-1-install-2"]);
    expect(blocks[1]).toEqual({ kind: "paragraph", children: [{ kind: "text", text: "Some text on two lines." }] });
    expect(blocks[2]).toMatchObject({ kind: "list", ordered: false, items: [[{ text: "first" }], [{ text: "second continued" }]] });
    expect(blocks[3]).toMatchObject({ kind: "list", ordered: true });
    expect(blocks[5]).toEqual({ kind: "code", text: "sudo dpkg -i nowly-host.deb" });
    expect(blocks[6]).toMatchObject({ kind: "table", head: [[{ text: "A" }], [{ text: "B" }]] });
  });

  it("skips MDX components and imports instead of rendering them", () => {
    const blocks = parseMarkdown("import { X } from \"y\"\n\n<CalloutInfo>\nHello\n</CalloutInfo>\n\n## Title");
    expect(blocks.map((block) => block.kind)).toEqual(["paragraph", "heading"]);
    expect(blocks[0]).toEqual({ kind: "paragraph", children: [{ kind: "text", text: "Hello" }] });
  });

  it("counts words across every block", () => {
    expect(markdownWordCount(parseMarkdown("## Two words\n\nThree more words.\n\n- and four more here"))).toBe(9);
  });
});

describe("frenchSpacing", () => {
  it("puts a no-break space before high punctuation and inside quotes", () => {
    expect(frenchSpacing("Prêt ? Oui : « vraiment » !")).toBe("Prêt\u00a0? Oui\u00a0: «\u00a0vraiment\u00a0»\u00a0!");
  });

  it("never touches code", () => {
    const [block] = mapBlockText(parseMarkdown("Lancez `a ? b` ?"), frenchSpacing);
    expect(block).toEqual({
      kind: "paragraph",
      children: [{ kind: "text", text: "Lancez " }, { kind: "code", text: "a ? b" }, { kind: "text", text: "\u00a0?" }],
    });
  });
});

describe("parseFrontmatter", () => {
  it("reads key: value lines and strips quotes", () => {
    expect(parseFrontmatter("---\ntitle: \"Nowly on Linux: .deb\"\norder: 3\n---\n\nBody")).toEqual({
      meta: { title: "Nowly on Linux: .deb", order: "3" },
      body: "\nBody",
    });
  });
});
