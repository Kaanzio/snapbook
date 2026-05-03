'use client';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <svg 
      width="180" 
      height="48" 
      viewBox="0 0 180 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon Group */}
      <g>
        <rect width="48" height="48" rx="14" fill="#111111" />
        <rect x="8" y="10" width="16" height="28" rx="2" fill="#222222" />
        <rect x="12" y="16" width="8" height="2" fill="#444444" />
        <rect x="12" y="22" width="6" height="2" fill="#444444" />
        <circle cx="35" cy="20" r="6" stroke="#444444" strokeWidth="2.5" fill="none" />
        <circle cx="35" cy="20" r="2.5" fill="#444444" />
        <rect x="28" y="30" width="14" height="8" rx="1.5" fill="#222222" />
      </g>
      
      {/* Text Group */}
      <g>
        <text 
          x="60" 
          y="26" 
          fill="var(--text-primary)" 
          fontFamily="Inter, -apple-system, sans-serif" 
          fontSize="22" 
          fontWeight="700"
        >
          snap
        </text>
        <text 
          x="114" 
          y="26" 
          fill="var(--text-secondary)" 
          fontFamily="Inter, -apple-system, sans-serif" 
          fontSize="22" 
          fontWeight="400"
        >
          book
        </text>
        <text 
          x="60" 
          y="42" 
          fill="var(--text-tertiary)" 
          fontFamily="Inter, -apple-system, sans-serif" 
          fontSize="11" 
          fontWeight="500"
        >
          visual notebook
        </text>
      </g>
    </svg>
  );
}
