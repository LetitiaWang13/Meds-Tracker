export function AppLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mm-ring" x1="16" y1="10" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#39C06B" />
          <stop offset="1" stopColor="#2D7BEA" />
        </linearGradient>
        <linearGradient id="mm-pill" x1="18" y1="22" x2="46" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#39C06B" />
          <stop offset="1" stopColor="#2D7BEA" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="30" fill="#F3FAF6" />
      <circle cx="32" cy="32" r="21" stroke="url(#mm-ring)" strokeWidth="5" />

      <rect x="18" y="25" width="28" height="18" rx="9" fill="url(#mm-pill)" />

      <path
        d="M32 49.5c-6.2-3.8-10.2-7.6-10.2-12.1 0-3 2.3-5.4 5.4-5.4 1.9 0 3.6 0.9 4.8 2.3 1.2-1.4 2.9-2.3 4.8-2.3 3.1 0 5.4 2.4 5.4 5.4 0 4.5-4 8.3-10.2 12.1Z"
        fill="#FF4D5A"
      />
    </svg>
  );
}

