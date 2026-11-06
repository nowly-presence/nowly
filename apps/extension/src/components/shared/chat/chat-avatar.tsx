import { useState } from "react";
import { cn } from "@/ui/cn";

const AVATAR_SIZE = 28;

export const ChatAvatar = ({ name, src, className }: {
  name: string;
  src?: string | null;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);

  if (src && !failed) return (
    <img
      src={src}
      alt=""
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      onError={() => setFailed(true)}
      className={cn("size-7 shrink-0 rounded-full object-cover", className)}
    />
  );

  return (
    <span
      aria-hidden
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-label-sm font-medium text-primary", className)}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
};