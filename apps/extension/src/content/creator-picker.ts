import { extractVariables, readElementImage, readElementLink, safeQuery } from "@/shared/creator/creator-dom";
import { selectorFor } from "@/shared/creator/creator-selector";
import type { CreatorPick, CreatorVariable } from "@nowly/presence-creator/creator-types";

const ACCENT = "#0891b2";
const HIGHLIGHT_MS = 1600;
const PREVIEW_MAX_LENGTH = 80;
const OVERLAY_Z_INDEX = "2147483647";

type PickerLabels = {
  hint: string;
  keys: string;
  cancel: string;
  move: string;
};

type ActivePicker = {
  cancel: () => void;
};

let active: ActivePicker | null = null;

const KEYBOARD_STEP_PX = 24;

const clampInto = (bar: HTMLElement, left: number, top: number) => {
  const rect = bar.getBoundingClientRect();
  Object.assign(bar.style, {
    transform: "none",
    left: `${Math.min(Math.max(8, left), window.innerWidth - rect.width - 8)}px`,
    top: `${Math.min(Math.max(8, top), window.innerHeight - rect.height - 8)}px`
  });
};

const makeDraggable = (bar: HTMLElement, grip: HTMLElement) => {
  let origin: {
    x: number;
    y: number;
    left: number;
    top: number;
  } | null = null;
  grip.addEventListener("pointerdown", (event) => {
    const rect = bar.getBoundingClientRect();
    origin = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };
    grip.setPointerCapture(event.pointerId);
    grip.classList.add("dragging");
    event.preventDefault();
  });
  grip.addEventListener("pointermove", (event) => {
    if (origin) clampInto(bar, origin.left + event.clientX - origin.x, origin.top + event.clientY - origin.y);
  });
  const stop = () => {
    origin = null;
    grip.classList.remove("dragging");
  };
  grip.addEventListener("pointerup", stop);
  grip.addEventListener("pointercancel", stop);
  grip.addEventListener("keydown", (event) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const move = moves[event.key];

    if (!move) return;

    const rect = bar.getBoundingClientRect();
    clampInto(bar, rect.left + move[0] * KEYBOARD_STEP_PX, rect.top + move[1] * KEYBOARD_STEP_PX);
    event.preventDefault();
    event.stopPropagation();
  });
};

const createOverlay = (labels: PickerLabels) => {
  const host = document.createElement("nowly-picker");
  host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${OVERLAY_Z_INDEX};`;
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      .box{position:fixed;border:2px solid ${ACCENT};background:${ACCENT}1f;border-radius:4px;transition:all 60ms ease-out;display:none}
      .tag{position:fixed;max-width:320px;padding:4px 8px;border-radius:6px;background:#07080c;color:#fff;font:12px/1.4 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none}
      .bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:10px 12px 10px 8px;border-radius:999px;background:#07080c;color:#fff;font:13px/1.3 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:auto;max-width:calc(100vw - 24px)}
      .grip{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;cursor:grab;touch-action:none;opacity:.7}
      .grip:hover{opacity:1;background:#ffffff1f}
      .grip.dragging{cursor:grabbing}
      .keys{opacity:.6}
      .cancel{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;background:#ffffff1f;white-space:nowrap}
    </style>
    <div class="box"></div><div class="tag"></div>
    <div class="bar"><span class="grip" role="button" tabindex="0"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/></svg></span><span class="hint"></span><span class="keys"></span><button class="cancel" type="button"></button></div>`;
  const hint = shadow.querySelector<HTMLElement>(".hint");
  const keys = shadow.querySelector<HTMLElement>(".keys");
  const grip = shadow.querySelector<HTMLElement>(".grip");
  const bar = shadow.querySelector<HTMLElement>(".bar");
  const button = shadow.querySelector<HTMLElement>(".cancel");
  if (hint) hint.textContent = labels.hint;
  if (keys) keys.textContent = labels.keys;
  if (button) button.textContent = labels.cancel;

  if (grip && bar) {
    grip.title = labels.move;
    grip.setAttribute("aria-label", labels.move);
    makeDraggable(bar, grip);
  }

  document.documentElement.append(host);
  return {
    host,
    box: shadow.querySelector<HTMLElement>(".box"),
    tag: shadow.querySelector<HTMLElement>(".tag"),
    bar,
    button
  };
};

const describe = (element: Element): string => {
  const text = element.textContent?.replace(/\s+/g, " ").trim().slice(0, PREVIEW_MAX_LENGTH);
  return `${element.tagName.toLowerCase()}${text ? `  ${text}` : ""}`;
};

const toPick = (element: Element): CreatorPick => {
  const image = readElementImage(element) ?? readElementImage(element.querySelector("img"));
  return {
    selector: selectorFor(element),
    text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, PREVIEW_MAX_LENGTH) || undefined,
    image,
    link: readElementLink(element.closest("a")),
    tag: element.tagName.toLowerCase(),
    at: Date.now()
  };
};

export const startPicker = (labels: PickerLabels): Promise<CreatorPick | null> => {
  active?.cancel();
  return new Promise((resolve) => {
    const overlay = createOverlay(labels);
    let current: Element | null = null;

    const place = (element: Element | null) => {
      current = element;

      if (!element || !overlay.box || !overlay.tag) return;

      const rect = element.getBoundingClientRect();
      Object.assign(overlay.box.style, {
        display: "block",
        left: `${rect.left - 2}px`,
        top: `${rect.top - 2}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      Object.assign(overlay.tag.style, {
        display: "block",
        left: `${Math.max(8, rect.left)}px`,
        top: `${rect.bottom + 6 > window.innerHeight - 30 ? rect.top - 30 : rect.bottom + 6}px`
      });
      overlay.tag.textContent = describe(element);
    };

    const finish = (pick: CreatorPick | null) => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);

      for (const type of ["mousedown", "mouseup", "pointerdown", "pointerup"]) window.removeEventListener(type, swallow, true);

      overlay.host.remove();
      active = null;
      resolve(pick);
    };

    const swallow = (event: Event) => {
      if (event.composedPath().includes(overlay.host)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (target && target !== overlay.host) place(target);
    };

    const onClick = (event: MouseEvent) => {
      if (event.composedPath().includes(overlay.host)) return;

      swallow(event);
      if (current) finish(toPick(current));
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.composedPath().includes(overlay.host)) return;

      if (event.key === "Escape") finish(null);
      else if (event.key === "ArrowUp" && current?.parentElement && current.parentElement !== document.body) place(current.parentElement);
      else if (event.key === "ArrowDown" && current?.firstElementChild) place(current.firstElementChild);
      else if (event.key === "Enter" && current) finish(toPick(current));
      else return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    overlay.button?.addEventListener("click", () => finish(null));
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);

    for (const type of ["mousedown", "mouseup", "pointerdown", "pointerup"]) window.addEventListener(type, swallow, true);

    active = {
      cancel: () => finish(null)
    };
  });
};

export const highlightSelector = (selector: string): boolean => {
  const element = safeQuery(document, selector);

  if (!element) return false;

  element.scrollIntoView({
    block: "center",
    behavior: "smooth"
  });
  const overlay = createOverlay({
    hint: "",
    keys: "",
    cancel: "",
    move: ""
  });
  overlay.bar?.remove();
  const rect = element.getBoundingClientRect();
  if (overlay.box) Object.assign(overlay.box.style, {
    display: "block",
    left: `${rect.left - 2}px`,
    top: `${rect.top - 2}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
  window.setTimeout(() => overlay.host.remove(), HIGHLIGHT_MS);
  return true;
};

const isVariableList = (value: unknown): value is CreatorVariable[] => Array.isArray(value);

const isPickerLabels = (value: unknown): value is PickerLabels =>
  Boolean(value) && typeof value === "object" && ["hint", "keys", "cancel", "move"].every((key) => typeof (value as Record<string, unknown>)[key] === "string");

export const registerCreatorBridge = (): void => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "CREATOR_PICK_START" && isPickerLabels(message.labels)) {
      void startPicker(message.labels).then(sendResponse);
      return true;
    }
    if (message?.type === "CREATOR_PICK_CANCEL") {
      active?.cancel();
      sendResponse(true);
      return false;
    }
    if (message?.type === "CREATOR_EXTRACT" && isVariableList(message.variables)) {
      sendResponse(extractVariables(message.variables, document, window.location.href));
      return false;
    }
    if (message?.type === "CREATOR_HIGHLIGHT" && typeof message.selector === "string") {
      sendResponse(highlightSelector(message.selector));
      return false;
    }

    return false;
  });
};