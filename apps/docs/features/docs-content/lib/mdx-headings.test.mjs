import assert from "node:assert/strict";
import { test } from "node:test";
import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import { createDocHeadings } from "./mdx-headings.ts";

test("the rendered docs and table of contents share heading IDs", async () => {
  const source = [
    "## Quick Start",
    "## **Use** `nowly pack` &amp; [publish](https://example.com)",
    "### Quick Start",
    "### Quick Start-2",
    "#### A deeper heading",
    "## 시작하기",
    "```markdown",
    "## A fenced example",
    "```"
  ].join("\n\n");
  const headings = createDocHeadings();
  const { content } = await compileMDX({
    source,
    options: { mdxOptions: { rehypePlugins: [headings.rehypePlugin] } }
  });
  const html = renderToStaticMarkup(content);

  assert.deepEqual(headings.items, [
    { id: "quick-start", text: "Quick Start", level: 2 },
    { id: "use-nowly-pack-publish", text: "Use nowly pack & publish", level: 2 },
    { id: "quick-start-2", text: "Quick Start", level: 3 },
    { id: "quick-start-2-2", text: "Quick Start-2", level: 3 },
    { id: "section", text: "시작하기", level: 2 }
  ]);
  assert.deepEqual(
    [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1]),
    headings.items.map((item) => item.id)
  );
  assert.match(html, /<h4 id="a-deeper-heading"/);
  assert.match(html, /data-heading-text="Use nowly pack &amp; publish"/);
});
