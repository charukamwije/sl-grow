import { useId } from "react";

// The app's mark, the same drawing as app/icon.svg (the browser tab icon)
export default function AppLogo({ className = "h-9 w-9" }: { className?: string }) {
  // Unique per instance: the header and footer both draw the logo
  const gradient = useId();

  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradient})`} />
      <path
        d="M47 14C29 14 17 23 17 37c0 4 1.4 7.6 3.6 10.4C24 39 31 31 40 26c-7.5 6.2-13.3 13.6-16 22.3 2.4 1.1 5 1.7 7.8 1.7C44 50 50 38 47 14Z"
        fill="#fff"
      />
      <path d="M14 53h36" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
