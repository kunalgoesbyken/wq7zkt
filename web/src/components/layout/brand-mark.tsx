export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M2 14c3-6 6-9 10-7s7 1 10-3v8c-3 4-6 5-10 3s-7 1-10 7z" fill="currentColor" opacity="0.22" />
      <path d="M2 17c3-5 6-7 10-5s7 0 10-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
