# Layout

- Tabs and pushed routes are `Layer`s that stay mounted while hidden so state survives navigation; `Layer` saves and restores `scrollTop` because Chrome zeroes it on hidden layers.
- The dock can take an `action` anchored to a tab (the library passes "Create a presence"): hovering or focusing the dock lifts a primary pill above that tab wherever the layout put it, joined by an SVG neck. It hides 180 ms after the pointer leaves and never shows while a tab is dragged.
- A dock item can take `wrap`, used to put a `FeatureReveal` around a tab button.
