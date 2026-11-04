import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import { useI18n } from "@/hooks/i18n-provider";
import { useFeatureReveals } from "@/hooks/feature-reveal-provider";
import { FeatureRevealExplain, FeatureRevealSpotlight, type SpotRect } from "@/components/shared/feature-reveal-overlay";

type FeatureRevealProps = {
  id: string;
  version: string;
  text: string;
  hint?: string;
  chained?: boolean;
  nextId?: string;
  onNext?: () => void;
  children: ReactNode;
};

const SETTLE_REMEASURE_MS = 450;

type Phase = "spotlight" | "explain";

const measure = (host: HTMLElement | null): SpotRect | null => {
  const target = host?.firstElementChild;

  if (!(target instanceof HTMLElement)) return null;

  const rect = target.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
};

export const FeatureReveal = ({ id, version, text, hint, chained, nextId, onNext, children }: FeatureRevealProps) => {
  const { t } = useI18n();
  const { activeId, register, complete, start } = useFeatureReveals();
  const hostRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("spotlight");
  const [rect, setRect] = useState<SpotRect | null>(null);
  const active = activeId === id;

  useEffect(() => register({ id, version, chained }), [id, version, chained, register]);

  useEffect(() => {
    if (!active) return;

    setPhase("spotlight");
    const first = hostRef.current?.firstElementChild;
    if (chained && first instanceof HTMLElement) first.scrollIntoView({ block: "center" });
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(measure(hostRef.current)));
    };
    update();
    const settle = window.setTimeout(update, SETTLE_REMEASURE_MS);
    const target = hostRef.current?.firstElementChild;
    const observer = new ResizeObserver(update);
    if (target) observer.observe(target);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [active, chained]);

  useEffect(() => {
    const target = hostRef.current?.firstElementChild;

    if (!active || phase !== "spotlight" || !target) return;

    const onClick = () => setPhase("explain");
    target.addEventListener("click", onClick);
    return () => target.removeEventListener("click", onClick);
  }, [active, phase]);

  const finish = useCallback(() => complete(id), [complete, id]);
  const advance = useCallback(() => {
    complete(id);
    onNext?.();
    if (nextId) start(nextId);
  }, [complete, id, nextId, onNext, start]);

  useEffect(() => {
    if (!active) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  return (
    <>
      <span ref={hostRef} className="contents">
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {active && rect && phase === "spotlight" && <FeatureRevealSpotlight key="spotlight" rect={rect} hint={hint} onSkip={finish} />}
          {active && phase === "explain" && (
            <FeatureRevealExplain
              key="explain"
              text={text}
              actionLabel={nextId ? t("reveal.next") : undefined}
              onSkip={finish}
              onDone={nextId ? advance : finish}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};