export function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M8.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M11.5 7a7 7 0 0 1 0 10" />
      <path d="M14.5 4.5a10.5 10.5 0 0 1 0 15" />
      <path d="M17.5 2a14 14 0 0 1 0 20" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function WifiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16.5a5 5 0 0 1 6 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

export function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 14" fill="none" className={className} aria-hidden>
      <rect x="1" y="1" width="23" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="3" width="16" height="8" rx="1.5" fill="currentColor" />
      <path d="M26 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
