export type NoloCostume = "halloween"

export type NoloCostumeLayer = { d: string; fill: string }

export type NoloCostumeArt = { transform: string; overhang: number; layers: readonly NoloCostumeLayer[] }

export const NOLO_COSTUMES: Record<NoloCostume, NoloCostumeArt> = {
  halloween: {
    transform: "rotate(-10 256 64) translate(256 64) scale(1.12) translate(-256 -64)",
    overhang: 0.48,
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
}
