import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponents } from "../components/mdx-components";
import { createDocHeadings } from "./mdx-headings";

export const compileDoc = async (source: string) => {
  const headings = createDocHeadings();
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      blockJS: false,
      mdxOptions: {
        rehypePlugins: [headings.rehypePlugin]
      }
    }
  });

  return {
    content,
    tocItems: headings.items
  };
};