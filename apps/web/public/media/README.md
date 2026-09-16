# Localized media

Drop locale-specific assets in the matching folder. The app picks the first file that exists:

1. `/media/{group}/{locale}/{file}` - e.g. `hero/fr-FR/card-front.png`
2. `/media/{group}/en-US/{file}`
3. `/media/{group}/default/{file}`

## Hero cards

Place these three files (PNG or WebP, keep the same names):

- `card-back.png` - furthest card
- `card-mid.png` - middle card
- `card-front.png` - closest card

Example: `public/media/hero/fr-FR/card-front.png`
