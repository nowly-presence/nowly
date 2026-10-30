# Layout

- Tabs and pushed routes are `Layer`s that stay mounted while hidden so state survives navigation; `Layer` saves and restores `scrollTop` because Chrome zeroes it on hidden layers.
- A dock item can take `wrap`, used to put a `FeatureReveal` around a tab button.
