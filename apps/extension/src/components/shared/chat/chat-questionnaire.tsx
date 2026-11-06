import { useState } from "react";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/ui/cn";

type ChatQuestionnaireProps = {
  title: string;
  question: string;
  choices: string[];
  otherLabel: string;
  submitLabel: string;
  placeholder: string;
  maxLength: number;
  busy: boolean;
  onSubmit: (answer: string) => void;
};

const OTHER = -1;

export const ChatQuestionnaire = ({ title, question, choices, otherLabel, submitLabel, placeholder, maxLength, busy, onSubmit }: ChatQuestionnaireProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [other, setOther] = useState("");
  const answer = selected === null ? "" : selected === OTHER ? other.trim() : (choices[selected] ?? "");
  const options = [
    ...choices.map((label, index) => ({ label, index })),
    {
      label: otherLabel,
      index: OTHER
    }
  ];

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-canvas p-3">
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-medium tracking-wide text-muted uppercase">{title}</span>
        {question && <p className="text-label-lg font-medium whitespace-pre-wrap text-ink">{question}</p>}
      </div>
      <div role="radiogroup" aria-label={title} className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.index}
            type="button"
            role="radio"
            aria-checked={selected === option.index}
            onClick={() => setSelected(option.index)}
            className={cn(
              "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-label-md text-ink transition-colors",
              selected === option.index ? "border-primary bg-primary-soft" : "border-line hover:border-line-strong"
            )}
          >
            <span
              aria-hidden
              className={cn("size-3.5 shrink-0 rounded-full border-2", selected === option.index ? "border-primary bg-primary" : "border-muted")}
            />
            {option.label}
          </button>
        ))}
      </div>
      {selected === OTHER && (
        <Textarea
          value={other}
          maxLength={maxLength}
          onChange={(event) => setOther(event.target.value)}
          placeholder={placeholder}
          className="min-h-20!"
          autoFocus
        />
      )}
      <Button disabled={!answer} loading={busy} onClick={() => onSubmit(answer)}>
        {submitLabel}
      </Button>
    </div>
  );
};