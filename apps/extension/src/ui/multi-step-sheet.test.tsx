import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MultiStepSheet, type SheetStep } from "@/ui/multi-step-sheet";
import { Sheet } from "@/ui/sheet";

const steps: SheetStep[] = [
  {
    id: "details",
    title: "Details",
    content: (
      <form id="details-form">
        <input name="name" required />
      </form>
    ),
    footer: (
      <button type="submit" form="details-form">
        Continue
      </button>
    )
  },
  {
    id: "confirm",
    title: "Confirm",
    description: "Review your details",
    content: <p>Saved draft</p>
  }
];

describe("multi-step sheet", () => {
  it("supports a form with its submit button in the footer without submitting on render", () => {
    const onClose = vi.fn();
    const sheet = MultiStepSheet({
      open: true,
      onClose,
      closeLabel: "Close",
      steps,
      currentStep: "details"
    });
    expect(sheet?.type).toBe(Sheet);
    expect(sheet?.props.progress).toEqual({
      current: 1,
      total: 2
    });
    expect(renderToStaticMarkup(sheet?.props.children)).toContain('id="details-form"');
    expect(renderToStaticMarkup(sheet?.props.footer)).toContain('form="details-form"');
    expect(onClose).not.toHaveBeenCalled();
  });

  it("selects a step by id and shows its progress", () => {
    const sheet = MultiStepSheet({
      open: true,
      onClose: vi.fn(),
      closeLabel: "Close",
      steps,
      currentStep: "confirm"
    });
    expect(sheet?.props.title).toBe("Confirm");
    expect(sheet?.props.description).toBe("Review your details");
    expect(sheet?.props.progress).toEqual({
      current: 2,
      total: 2
    });
    expect(renderToStaticMarkup(sheet?.props.children)).toContain("Saved draft");
  });

  it("omits progress for a single step and blocks dismissal while busy", () => {
    const onClose = vi.fn();
    const props = {
      open: true,
      onClose,
      closeLabel: "Close",
      steps: steps.slice(0, 1),
      currentStep: "details"
    };
    const busy = MultiStepSheet({
      ...props,
      busy: true
    });
    expect(busy?.props.progress).toBeUndefined();
    busy?.props.onClose();
    expect(onClose).not.toHaveBeenCalled();
    MultiStepSheet(props)?.props.onClose();
    expect(onClose).toHaveBeenCalledOnce();
  });
});