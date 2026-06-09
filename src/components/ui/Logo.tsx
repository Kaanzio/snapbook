'use client';

import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

// Kamera aperture bıçağı
const B = 'M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z';

export default function Logo({ className = 'h-8 w-auto', iconOnly = false }: LogoProps) {
  const uniqueId = useId().replace(/:/g, '');
  const bladeGrad = `sb-bg-${uniqueId}`;
  const textGrad = `sb-tg-${uniqueId}`;
  const overlapClip = `sb-oc-${uniqueId}`;

  const defs = (
    <defs>
      <linearGradient id={bladeGrad} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#E50914" />
        <stop offset="100%" stopColor="#8A050C" />
      </linearGradient>
      <clipPath id={overlapClip}>
        <polygon points="50,50 100,50 100,95 75,95" />
      </clipPath>
      <linearGradient id={textGrad} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#B2070F" />
        <stop offset="100%" stopColor="#E50914" />
      </linearGradient>
    </defs>
  );

  const aperture = (
    <g>
      <path d={B} fill={`url(#${bladeGrad})`} />
      <path d={B} transform="rotate(60,50,50)" fill={`url(#${bladeGrad})`} />
      <path d={B} transform="rotate(120,50,50)" fill={`url(#${bladeGrad})`} />
      <path d={B} transform="rotate(180,50,50)" fill={`url(#${bladeGrad})`} />
      <path d={B} transform="rotate(240,50,50)" fill={`url(#${bladeGrad})`} />
      <path d={B} transform="rotate(300,50,50)" fill={`url(#${bladeGrad})`} />
      <path d={B} fill={`url(#${bladeGrad})`} clipPath={`url(#${overlapClip})`} />
    </g>
  );

  if (iconOnly) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ display: 'block' }} aria-label="Snapbook" role="img">
        {defs}
        {aperture}
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" className={className} style={{ display: 'block' }} aria-label="Snapbook" role="img">
      {defs}
      {/* İkonu %70 küçültüp, viewBox'un tam merkezine oturtuyoruz ki yazıyla aynı boyda olsun */}
      <g transform="translate(15, 15) scale(0.7)">
        {aperture}
      </g>
      <text
        x="95"
        y="66"
        fontFamily="'Poppins', system-ui, sans-serif"
        fontSize="62"
        fontWeight="800"
        fill={`url(#${textGrad})`}
        letterSpacing="-1.5"
      >
        snapbook
      </text>
    </svg>
  );
}
