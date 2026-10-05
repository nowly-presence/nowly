export type NoloCostume = "halloween" | "new-year" | "winter" | "spring" | "summer" | "autumn"

export type NoloCostumeLayer = { d: string; fill: string }

export type NoloCostumeArt = { transform: string; overhang: number; layers: readonly NoloCostumeLayer[] }

export const NOLO_COSTUMES: Record<NoloCostume, NoloCostumeArt> = {
  halloween: {
    transform: "translate(0 -20) rotate(-10 256 64) translate(256 64) scale(1.12) translate(-256 -64)",
    overhang: 0.52,
    layers: [
      {
        d: "M104 64C130 -10 170 -100 236 -160C262 -184 300 -200 340 -194C354 -192 356 -178 344 -174C318 -166 302 -144 300 -114C304 -40 360 20 408 64Z",
        fill: "var(--nolo-hat)",
      },
      {
        d: "M118 22C200 8 320 8 384 22C392 34 400 46 406 58C320 46 190 46 108 58C110 46 114 34 118 22Z",
        fill: "var(--nolo-hat-band)",
      },
      {
        d: "M256 34C366 34 456 47 456 64C456 81 366 94 256 94C146 94 56 81 56 64C56 47 146 34 256 34Z",
        fill: "var(--nolo-hat)",
      },
    ],
  },
  "new-year": {
    transform: "rotate(8 256 64)",
    overhang: 0.5,
    layers: [
      { d: "M146 52Q256 80 366 52L270 -210Z", fill: "var(--nolo-hat)" },
      { d: "M183 -22L337 -22L324 -55L198 -55Z", fill: "var(--nolo-hat-band)" },
      { d: "M223 -108L305 -108L297 -131L235 -131Z", fill: "var(--nolo-hat-band)" },
      { d: "M240 -214A30 30 0 1 0 300 -214A30 30 0 1 0 240 -214Z", fill: "var(--nolo-hat-tip)" },
    ],
  },
  winter: {
    transform: "rotate(-3 256 64)",
    overhang: 0.3,
    layers: [
      { d: "M80 52C80 -40 160 -84 256 -84C352 -84 432 -40 432 52Z", fill: "var(--nolo-hat)" },
      { d: "M62 40C150 22 362 22 450 40L456 84C362 66 150 66 56 84Z", fill: "var(--nolo-hat-band)" },
      { d: "M216 -108A40 40 0 1 0 296 -108A40 40 0 1 0 216 -108Z", fill: "var(--nolo-hat-tip)" },
    ],
  },
  spring: {
    transform: "rotate(-6 256 64)",
    overhang: 0.12,
    layers: [
      { d: "M244 30C262 4 294 -6 324 0C312 24 288 38 256 38Z", fill: "var(--nolo-hat-tip)" },
      { d: "M172 -12A24 24 0 1 0 220 -12A24 24 0 1 0 172 -12Z M204 11A24 24 0 1 0 252 11A24 24 0 1 0 204 11Z M192 50A24 24 0 1 0 240 50A24 24 0 1 0 192 50Z M152 50A24 24 0 1 0 200 50A24 24 0 1 0 152 50Z M140 11A24 24 0 1 0 188 11A24 24 0 1 0 140 11Z", fill: "var(--nolo-hat)" },
      { d: "M174 22A22 22 0 1 0 218 22A22 22 0 1 0 174 22Z", fill: "var(--nolo-hat-band)" },
    ],
  },
  summer: {
    transform: "rotate(-3 256 64)",
    overhang: 0.15,
    layers: [
      { d: "M256 22C390 22 492 34 492 48C492 62 390 74 256 74C122 74 20 62 20 48C20 34 122 22 256 22Z", fill: "var(--nolo-hat)" },
      { d: "M150 46C150 -30 198 -64 256 -64C314 -64 362 -30 362 46Z", fill: "var(--nolo-hat-tip)" },
      { d: "M151 18C220 8 292 8 361 18L362 42C292 32 220 32 150 42Z", fill: "var(--nolo-hat-band)" },
    ],
  },
  autumn: {
    transform: "rotate(-6 256 64)",
    overhang: 0.27,
    layers: [
      { d: "M250 -28C248 -46 254 -60 268 -66L278 -58C268 -52 264 -42 266 -28Z", fill: "var(--nolo-hat-tip)" },
      { d: "M74 70C56 12 146 -32 256 -32C378 -32 458 10 438 70C364 52 148 52 74 70Z", fill: "var(--nolo-hat)" },
      { d: "M272 -62C290 -104 330 -124 372 -118C370 -82 340 -56 296 -52C286 -54 278 -58 272 -62Z", fill: "var(--nolo-hat-band)" },
      { d: "M282 -62C306 -82 332 -98 358 -108L362 -102C336 -90 310 -74 288 -58Z", fill: "var(--nolo-hat-tip)" },
    ],
  },
}
