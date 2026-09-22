"use client";

import { Link } from "@/i18n/navigation";
import { ButtonLink as BaseButtonLink } from "@nowly/ui";
import type { ComponentProps } from "react";

// Binds @nowly/ui's ButtonLink to next-intl's locale-aware Link so button-styled
// internal navigation (/library, /desktop...) stays on the current locale prefix.
export const ButtonLink = (props: ComponentProps<typeof BaseButtonLink>) => (
  <BaseButtonLink linkComponent={Link} {...props} />
);
