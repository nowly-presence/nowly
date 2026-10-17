import { describe, expect, it } from "vitest";
import { frenchSpacing, mapBlockText, markdownHeadings, markdownWordCount, parseMarkdown } from "./markdown";

describe("guide screenshot blocks", () => {
  it("parses CDN screenshots and an optional caption between paragraphs", () => {
    expect(parseMarkdown('Before\n![Activity editor](https://cdn.nowly.me/guides/editor.png "Preview and text fields")\nAfter')).toEqual([
      {
        kind: "paragraph",
        children: [
          {
            kind: "text",
            text: "Before"
          }
        ]
      },
      {
        kind: "image",
        src: "https://cdn.nowly.me/guides/editor.png",
        alt: "Activity editor",
        caption: "Preview and text fields"
      },
      {
        kind: "paragraph",
        children: [
          {
            kind: "text",
            text: "After"
          }
        ]
      }
    ]);
  });

  it("accepts query strings without requiring a caption", () => {
    expect(parseMarkdown("![Editor](https://cdn.nowly.me/guides/editor.webp?v=2)")).toEqual([
      {
        kind: "image",
        src: "https://cdn.nowly.me/guides/editor.webp?v=2",
        alt: "Editor"
      }
    ]);
  });

  it("accepts the public guide screenshot host", () => {
    const source = "https://images.nowly.me/guides-screenshots/custom-activities/03-editor-preview.png";
    expect(parseMarkdown(`![Activity editor](${source} "Preview and text fields")`)).toEqual([
      {
        kind: "image",
        src: source,
        alt: "Activity editor",
        caption: "Preview and text fields"
      }
    ]);
  });

  it.each([
    "http://cdn.nowly.me/image.png",
    "javascript:alert",
    "data:image/png;base64,AAAA",
    "//cdn.nowly.me/image.png",
    "/local.png",
    "https://example.com/image.png",
    "https://cdn.nowly.me.example.com/image.png",
    "https://cdn.nowly.me:8080/image.png",
    "https://user:password@cdn.nowly.me/image.png",
    "https://cdn.nowly.me@evil.example/image.png",
    "http://images.nowly.me/image.png",
    "https://images.nowly.me.example.com/image.png",
    "https://images.nowly.me:8080/image.png",
    "https://user:password@images.nowly.me/image.png",
    "https://images.nowly.me@evil.example/image.png"
  ])("does not render unsafe or unsupported image sources: %s", (source) => {
    expect(parseMarkdown(`![Readable description](${source})`)).toEqual([
      {
        kind: "paragraph",
        children: [
          {
            kind: "text",
            text: "Readable description"
          }
        ]
      }
    ]);
  });

  it("leaves image syntax in fenced code untouched", () => {
    expect(parseMarkdown("```\n![Editor](https://cdn.nowly.me/image.png)\n```")).toEqual([
      {
        kind: "code",
        text: "![Editor](https://cdn.nowly.me/image.png)"
      }
    ]);
  });

  it("does not put images in the table of contents and counts captions", () => {
    const blocks = parseMarkdown('## Images\n\n![Activity editor](https://cdn.nowly.me/editor.png "Editor preview")');
    expect(markdownHeadings(blocks)).toEqual([
      {
        id: "images",
        text: "Images",
        level: 2
      }
    ]);
    expect(markdownWordCount(blocks)).toBe(3);
  });

  it("localizes captions and alt text without changing the URL", () => {
    const source = "https://cdn.nowly.me/editor.png?q=hello";
    expect(mapBlockText(parseMarkdown(`![Aperçu : nom](${source} "Éditeur : aperçu")`), frenchSpacing)).toEqual([
      {
        kind: "image",
        src: source,
        alt: "Aperçu\u00a0: nom",
        caption: "Éditeur\u00a0: aperçu"
      }
    ]);
  });
});