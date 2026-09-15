"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconHelpCircle } from "@tabler/icons-react";

type FaqItem = {
  question: string;
  answer: string | ReactNode;
};

type FaqProps = {
  title?: string;
  description?: string;
  items: FaqItem[];
  className?: string;
  allowMultiple?: boolean;
};

type FaqItemProps = {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
};

const FaqItemComponent: FC<FaqItemProps> = ({ item, isOpen, onToggle }) => {
  return (
    <div className="border-border/50 border-b last:border-b-0">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
          {item.question}
        </span>
        <IconChevronDown
          className={cn(
            "text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-all duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] pb-4 opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Faq: FC<FaqProps> = ({
  title,
  description,
  items,
  className,
  allowMultiple = false,
}) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={cn("my-6 overflow-hidden rounded-lg border border-border", className)}>
      {title && (
        <div className="bg-muted/50 border-border/50 border-b px-4 py-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <IconHelpCircle className="text-primary h-4 w-4" />
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground mt-1 text-xs">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="px-4">
        {items.map((item, index) => (
          <FaqItemComponent
            key={index}
            item={item}
            isOpen={openIndexes.includes(index)}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
};
