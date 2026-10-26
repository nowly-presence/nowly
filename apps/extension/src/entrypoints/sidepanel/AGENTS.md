# Side panel entry

`main.tsx` mounts providers in this order: `I18nProvider` > `ExtensionStateProvider` > `SeasonProvider` > `NavigationProvider` > `ToastProvider` > `App`. `app.tsx` wraps its content in `LegalGate` and owns tabs, pushed routes, the dock and the app-wide overlays.

## Gotchas

- Chrome injects its own unlayered default text stylesheet into extension pages; body typography in `styles.css` is deliberately unlayered with higher specificity or it gets overridden.
- Tailwind scans `src/` explicitly (`@source "../../"`) because the Vite root is this folder.
- Secondary screens use module-scope `React.lazy` declarations and a `Suspense` boundary inside each `Layer`. Keep the header and dock outside those boundaries, and retain visited layers so navigation preserves form state and scroll. Lazy chunks are packaged locally; never fetch executable code from the network. The legal gate and initial Activity screen stay eager.
