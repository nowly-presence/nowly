const STABLE_ATTRIBUTES = ["data-testid", "data-test", "data-qa", "data-cy", "itemprop", "aria-label", "name", "title"] as const;
const MAX_DEPTH = 6;
const MAX_CLASSES = 2;
const ATTRIBUTE_VALUE_MAX_LENGTH = 60;

const looksGenerated = (value: string): boolean => /\d{3,}|[a-f0-9]{6,}|__|--[a-z0-9]{5,}|^css-|^sc-|^jsx-/i.test(value);

const isUnique = (root: Document, selector: string, element: Element): boolean => {
  try {
    const matches = root.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch {
    return false;
  }
};

const attributeSelector = (element: Element): string | null => {
  const tag = element.tagName.toLowerCase();

  for (const attribute of STABLE_ATTRIBUTES) {
    const value = element.getAttribute(attribute);

    if (value && value.length <= ATTRIBUTE_VALUE_MAX_LENGTH && !looksGenerated(value)) return `${tag}[${attribute}="${CSS.escape(value)}"]`;
  }

  return null;
};

const idSelector = (element: Element): string | null => (element.id && !looksGenerated(element.id) ? `#${CSS.escape(element.id)}` : null);

const stepFor = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const classes = [...element.classList].filter((name) => !looksGenerated(name)).slice(0, MAX_CLASSES);
  const base = `${tag}${classes.map((name) => `.${CSS.escape(name)}`).join("")}`;
  const parent = element.parentElement;

  if (!parent) return base;

  const sameKind = [...parent.children].filter((child) => child.tagName === element.tagName);

  if (sameKind.length <= 1) return base;

  const siblingsMatching = [...parent.children].filter((child) => child.matches(base));
  return siblingsMatching.length > 1 ? `${base}:nth-of-type(${sameKind.indexOf(element) + 1})` : base;
};

export const selectorFor = (element: Element): string => {
  const root = element.ownerDocument;

  for (const candidate of [
    idSelector(element),
    attributeSelector(element)
  ]) {
    if (candidate && isUnique(root, candidate, element)) return candidate;
  }

  const steps: string[] = [];
  let current: Element | null = element;

  for (let depth = 0; current && depth < MAX_DEPTH; depth++) {
    const anchor = depth > 0 ? (idSelector(current) ?? attributeSelector(current)) : null;

    if (anchor && isUnique(root, anchor, current)) {
      steps.unshift(anchor);
      break;
    }

    steps.unshift(stepFor(current));
    const selector = steps.join(" > ");

    if (isUnique(root, selector, element)) return selector;

    current = current.parentElement;
  }

  return steps.join(" > ");
};