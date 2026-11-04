import { useEffect, useMemo, useState } from "react";
import { parseRichText, richTextToPlain, type RichStyle } from "@/lib/rich-text";
import { cn } from "@/ui/cn";

type StreamingTextProps = {
  text: string;
  play: boolean;
  complete?: boolean;
  charDelayMs?: number;
  onDone?: () => void;
  className?: string;
};

type StyledGrapheme = RichStyle & {
  value: string;
};

type Run = RichStyle & {
  text: string;
};

const DEFAULT_CHAR_DELAY_MS = 24;
const PAUSE_CHARS = /[.,!?;:。，！？]/;
const PAUSE_FACTOR = 7;

const splitGraphemes = (text: string): string[] =>
  typeof Intl.Segmenter === "function"
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
          text,
        ),
        (part) => part.segment,
      )
    : Array.from(text);

const toStyledGraphemes = (text: string): StyledGrapheme[] =>
  parseRichText(text).flatMap(({ text: segment, bold, italic, underline }) =>
    splitGraphemes(segment).map((value) => ({ value, bold, italic, underline })),
  );

const toRuns = (graphemes: readonly StyledGrapheme[]): Run[] =>
  graphemes.reduce<Run[]>((runs, grapheme) => {
    const last = runs[runs.length - 1];

    if (
      last &&
      last.bold === grapheme.bold &&
      last.italic === grapheme.italic &&
      last.underline === grapheme.underline
    ) {
      last.text += grapheme.value;
      return runs;
    }

    runs.push({
      text: grapheme.value,
      bold: grapheme.bold,
      italic: grapheme.italic,
      underline: grapheme.underline,
    });
    return runs;
  }, []);

const renderRuns = (runs: readonly Run[]) =>
  runs.map((run, index) => (
    <span
      key={index}
      className={cn(
        run.bold && "font-bold",
        run.italic && "italic",
        run.underline && "underline underline-offset-2",
      )}
    >
      {run.text}
    </span>
  ));

export const StreamingText = ({
  text,
  play,
  complete = false,
  charDelayMs = DEFAULT_CHAR_DELAY_MS,
  onDone,
  className,
}: StreamingTextProps) => {
  const graphemes = useMemo(() => toStyledGraphemes(text), [text]);
  const plain = useMemo(() => richTextToPlain(parseRichText(text)), [text]);
  const [count, setCount] = useState(0);
  const shown = complete ? graphemes.length : count;
  const done = shown >= graphemes.length;

  useEffect(() => setCount(0), [text]);

  useEffect(() => {
    if (!play || done) return;
    const previous = graphemes[shown - 1]?.value ?? "";
    const timer = window.setTimeout(
      () => setCount((value) => value + 1),
      PAUSE_CHARS.test(previous) ? charDelayMs * PAUSE_FACTOR : charDelayMs,
    );
    return () => window.clearTimeout(timer);
  }, [play, done, shown, graphemes, charDelayMs]);

  useEffect(() => {
    if (done && play) onDone?.();
  }, [done, play, onDone]);

  return (
    <span className={cn("whitespace-pre-line", className)} aria-label={plain}>
      <span aria-hidden>{renderRuns(toRuns(graphemes.slice(0, shown)))}</span>
      <span aria-hidden className="opacity-0">
        {renderRuns(toRuns(graphemes.slice(shown)))}
      </span>
    </span>
  );
};
