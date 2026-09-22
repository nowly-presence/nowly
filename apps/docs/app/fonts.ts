import localFont from "next/font/local";

export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Variable.woff2", style: "normal" },
    { path: "./fonts/Satoshi-Variable-Italic.woff2", style: "italic" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
