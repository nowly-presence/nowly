"use client";

import { buttonVariants, type ButtonVariantProps } from "./button-variants";
import { cn } from "./utils";
import NextLink from "next/link";
import type { ComponentProps, ComponentType } from "react";

type ButtonLinkProps = ComponentProps<typeof NextLink> & ButtonVariantProps & {
  // Apps with locale-prefixed routing pass their own `Link` (e.g. next-intl's) here
  // so button-styled internal navigation still resolves to the right locale.
  // Typed as `any`: next-intl's Link has a structurally different but runtime-compatible props shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkComponent?: ComponentType<any>
};

export const ButtonLink = ({ className, variant, size, linkComponent, ...props }: ButtonLinkProps) => {
  const LinkComponent = linkComponent ?? NextLink;
  return <LinkComponent className={cn(buttonVariants({ variant, size }), className)} {...props} />;
};

type ButtonAnchorProps = ComponentProps<"a"> & ButtonVariantProps;

export const ButtonAnchor = ({ className, variant, size, ...props }: ButtonAnchorProps) => (
  <a className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
