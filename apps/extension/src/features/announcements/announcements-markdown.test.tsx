import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnouncementsMarkdown, safeAnnouncementLink } from "./announcements-markdown";

describe("safe announcement markdown", () => {
  it("renders release headings, emphasis, lists, code and HTTPS links", () => {
    const html = renderToStaticMarkup(
      <AnnouncementsMarkdown
        content={'## Release\n\n### Improvements\n\n- **Bold** and *emphasis*\n- `code`\n\n[Status](https://nowly.me/status)\n\n```js\nalert("text only")\n```'}
      />
    );

    for (const tag of ["<h2", "<h3", "<ul", "<li", "<strong", "<em", "<code", "<pre", 'href="https://nowly.me/status"', 'rel="noopener noreferrer"'])
      expect(html).toContain(tag);
  });
  it("never executes HTML, SVG, MDX, scripts, images or unsafe protocols", () => {
    const html = renderToStaticMarkup(
      <AnnouncementsMarkdown
        content={
          '<script>alert(1)</script>\n\n<svg onload="alert(1)"></svg>\n\n{globalThis.alert(1)}\n\n[run](javascript:alert) [data](data:text/html,test) ![tracking](https://example.com/image.svg)'
        }
      />
    );
    expect(html).not.toMatch(/<(script|svg|img)\b|href="(javascript|data):|onload="/);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("{globalThis.alert(1)}");
    expect(safeAnnouncementLink("https://user:password@example.com")).toBeNull();
    expect(safeAnnouncementLink("//example.com")).toBeNull();
  });
});