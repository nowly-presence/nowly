"use client";

import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonVariantProps;

export const ButtonLink = ({ className, variant, size, ...props }: ButtonLinkProps) => (
  <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
);

type ButtonAnchorProps = ComponentProps<"a"> & ButtonVariantProps;

export const ButtonAnchor = ({ className, variant, size, ...props }: ButtonAnchorProps) => (
  <a className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
