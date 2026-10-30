# Side panel entry

- Provider order in `main.tsx` matters: `I18nProvider` > `ExtensionStateProvider` > `SeasonProvider` > `NavigationProvider` > `ToastProvider` > `App`.
- Body typography in `styles.css` is deliberately unlayered with higher specificity: Chrome injects its own default text stylesheet into extension pages.
- Tailwind scans `src/` explicitly (`@source "../../"`) because the Vite root is this folder.
- Secondary screens are module-scope `React.lazy` with a `Suspense` inside each `Layer`. Keep the header and dock outside those boundaries, keep visited layers mounted, and keep the legal gate and the Activity screen eager. Never fetch executable code from the network.
