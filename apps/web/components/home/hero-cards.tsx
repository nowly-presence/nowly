"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroCardsProps = {
  cards: {
    back: string
    mid: string
    front: string
  }
};

const SLOTS = [
  { left: "6.11%", top: "33.47%", zIndex: 1 },
  { left: "13.47%", top: "0%", zIndex: 2 },
  { left: "0%", top: "15.29%", zIndex: 3 }
] as const;

const ROTATE_INTERVAL_MS = 3200;
const TRANSITION = "left 900ms cubic-bezier(0.22, 1, 0.36, 1), top 900ms cubic-bezier(0.22, 1, 0.36, 1)";

export const HeroCards = ({ cards }: HeroCardsProps) => {
  const images = [cards.front, cards.back, cards.mid];
  const [slotOf, setSlotOf] = useState([0, 1, 2]);

  useEffect(() => {
    const id = setInterval(() => {
      setSlotOf((prev) => prev.map((slot) => (slot + 1) % SLOTS.length));
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[475/242] w-full max-w-[680px] lg:max-w-none">
      <div
        className="pointer-events-none absolute left-[6.74%] top-[1.24%] h-[87.19%] w-[93.26%] bg-[radial-gradient(circle_at_14%_30%,rgba(34,211,238,0.45),transparent_46%),radial-gradient(circle_at_90%_72%,rgba(34,211,238,0.28),transparent_44%)] blur-3xl"
        aria-hidden
      />
      {images.map((src, index) => {
        const slot = SLOTS[slotOf[index]];

        return (
          <div
            key={src}
            className="absolute h-[66.53%] w-[85.05%]"
            style={{ left: slot.left, top: slot.top, zIndex: slot.zIndex, transition: TRANSITION }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="680px"
              className="object-contain"
              priority
              loading="eager"
            />
          </div>
        );
      })}
    </div>
  );
};
