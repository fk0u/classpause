/** Hand-drawn accents from the brand: a scribble underline, a squiggle loop and a flower star. Decorative only. */
export function Scribble({ className = "", color = "#ED9AFF" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 220 40" className={`scribble ${className}`} fill="none">
      <path d="M4 22c40-14 80-14 120-6s70 4 92-6M10 30c50-10 110-10 190-14" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function Flower({ className = "", color = "#ED9AFF" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className} fill="none">
      <path d="M60 18c10 22 8 30 0 42c-8-12-10-20 0-42Zm0 84c-10-22-8-30 0-42c8 12 10 20 0 42ZM18 60c22-10 30-8 42 0c-12 8-20 10-42 0Zm84 0c-22 10-30 8-42 0c12-8 20-10 42 0ZM30 30c20 10 24 16 30 30c-14-6-20-10-30-30Zm60 60c-20-10-24-16-30-30c14 6 20 10 30 30Zm0-60c-10 20-16 24-30 30c6-14 10-20 30-30ZM30 90c10-20 16-24 30-30c-6 14-10 20-30 30Z"
        stroke={color} strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

export function Spark({ className = "", color = "#A0FF83" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className} fill="none">
      <path d="M50 6l8 30 30-10-22 24 26 18-32-2-4 30-10-28-26 16 14-28-28-14 32-4z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

export function Squiggle({ className = "", color = "#A0FF83" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 300 300" className={className} fill="none">
      <path d="M20 260C60 120 90 60 120 90s-40 150 10 140 90-200 120-180-30 170 20 190" stroke={color} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
