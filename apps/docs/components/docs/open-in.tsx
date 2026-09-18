"use client";
import { RiArrowDownSLine, RiExternalLinkLine } from "@nowly/ui/icons";

import { ClaudeIcon, GitHubIcon, OpenAIIcon } from "@/components/icons";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@nowly/ui";


import { DOCS_URL, PROJECT_REPOSITORY_URL } from "@/lib/constants";
import { docHref } from "@/lib/docs/href";

import type { FC } from "react";

type OpenInProps = {
  slug: string;
  locale: string;
};

const buildSearchUrl = (url: string) => {
  return `Read ${url}, I want to ask questions about it.`;
};

export const OpenIn: FC<OpenInProps> = ({ slug, locale }) => {
  const githubUrl = `${PROJECT_REPOSITORY_URL}/blob/stable/apps/docs/content/docs/${slug}/${locale}.mdx`;
  const markdownUrl = `${DOCS_URL}${docHref(slug)}`;

  const services = [
    { name: "GitHub", url: githubUrl, icon: <GitHubIcon className="size-4" /> },
    { name: "ChatGPT", url: `https://chatgpt.com/?q=${encodeURIComponent(buildSearchUrl(markdownUrl))}`, icon: <OpenAIIcon className="size-4" /> },
    { name: "Claude", url: `https://claude.ai/new?q=${encodeURIComponent(buildSearchUrl(markdownUrl))}`, icon: <ClaudeIcon /> },
  ];

  const openInService = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        Open in
        <RiArrowDownSLine className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-xl w-full" align="end">
        {services.map((service) => (
          <DropdownMenuItem
            key={service.name}
            onClick={() => openInService(service.url)}
            className="group flex items-center gap-2 transition-colors"
          >
            {service.icon}
            <span>Open in {service.name}</span>
            <RiExternalLinkLine className="text-muted-foreground ml-auto size-4" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
