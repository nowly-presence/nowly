import { notFound } from "next/navigation";

// Matches any path under a valid locale prefix that isn't a real page (e.g. /pl/azz),
// so it renders inside the [locale] tree and triggers the translated app/[locale]/not-found.tsx
// instead of the plain app/global-not-found.tsx (which has no next-intl context).
const CatchAll = (): never => notFound();

export default CatchAll;
