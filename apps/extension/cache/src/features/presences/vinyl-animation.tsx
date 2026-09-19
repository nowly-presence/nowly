import type { ReactElement } from "react";

type Props = {
  size?: number;
};

const VinylAnimation = ({ size = 120 }: Props): ReactElement => (
  <div className="flex items-center justify-center" aria-hidden="true">
    <style>{`@keyframes vinyl-spin { to { transform: rotate(360deg); } }`}</style>
    <svg
      viewBox="0 0 200 200"
      className="shrink-0"
      style={{ width: size, height: size, animation: "vinyl-spin 4s linear infinite" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="vinyl-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="70%" stopColor="#111" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id="grooves" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="35%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="36%" stopColor="#2a2a2a" stopOpacity="0.5" />
          <stop offset="37%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="51%" stopColor="#2a2a2a" stopOpacity="0.5" />
          <stop offset="52%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="65%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="66%" stopColor="#2a2a2a" stopOpacity="0.5" />
          <stop offset="67%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="80%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="81%" stopColor="#2a2a2a" stopOpacity="0.5" />
          <stop offset="82%" stopColor="#222" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#vinyl-grad)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="85" fill="url(#grooves)" />
      <circle cx="100" cy="100" r="38" fill="#1a1a1a" />
      <circle cx="100" cy="100" r="38" fill="none" stroke="#2a2a2a" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="28" fill="var(--color-accent, #5865F2)" opacity="0.9" />
      <circle cx="100" cy="100" r="28" fill="none" stroke="#000" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="12" fill="#1a1a1a" />
      <circle cx="100" cy="100" r="12" fill="none" stroke="#2a2a2a" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="4" fill="#0a0a0a" />
      <circle cx="100" cy="100" r="4" fill="none" stroke="#333" strokeWidth="0.3" />
      <circle cx="100" cy="98" r="1.5" fill="#fff" opacity="0.15" />
      <circle cx="100" cy="100" r="96" fill="url(#shine)" />
    </svg>
  </div>
);

export default VinylAnimation;