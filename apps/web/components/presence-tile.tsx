import { cn } from "@/lib/utils";
import Image from "next/image";

type PresenceTileProps = {
  src: string
  name: string
  className?: string
};

export const PresenceTile = ({ src, name, className }: PresenceTileProps) => (
  <div
    className={cn(
      "relative shrink-0 overflow-hidden rounded-[19.32%] border border-[#110f0f] bg-[#03080c]",
      className,
    )}
  >
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[19.32%] blur-[8px]">
      <Image
        src={src}
        alt=""
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
    <div className="absolute inset-[4.35%] overflow-hidden rounded-[15.79%]">
      <Image
        src={src}
        alt={name}
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
  </div>
);
