/** Tap's mark: a droplet with a level line, on a rounded brand-green square. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <rect x="0" y="0" width="36" height="36" rx="10" fill="#177A63" />
      <path d="M18 6 C18 6 9 16.5 9 22 a9 9 0 0 0 18 0 C27 16.5 18 6 18 6 Z" fill="#F3F7F5" />
      <rect x="7" y="19" width="22" height="3" fill="#177A63" />
    </svg>
  );
}
