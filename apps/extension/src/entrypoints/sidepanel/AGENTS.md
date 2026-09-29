# Side panel entry

`main.tsx` mounts providers in this order: `I18nProvider` > `ExtensionStateProvider` > `NavigationProvider` > `ToastProvider` > `App`. `app.tsx` owns tabs, pushed routes and the dock.

## Gotchas

- Chrome injects its own unlayered default text stylesheet into extension pages; body typography in `styles.css` is deliberately unlayered with higher specificity or it gets overridden.
- Tailwind scans `src/` explicitly (`@source "../../"`) because the Vite root is this folder.
