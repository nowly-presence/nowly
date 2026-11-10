"use client";

import { Link } from "@/i18n/navigation";
import { ButtonLink as BaseButtonLink } from "@nowly/ui/button-link";
import type { ComponentProps } from "react";

export const ButtonLink = (props: ComponentProps<typeof BaseButtonLink>) => <BaseButtonLink linkComponent={Link} {...props} />;