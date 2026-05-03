'use client';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <img 
      src="/snapbook/logo-header.svg" 
      alt="Snapbook Logo" 
      className={className}
      style={{ display: 'block' }}
    />
  );
}
