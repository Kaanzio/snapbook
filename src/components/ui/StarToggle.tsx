'use client';

interface StarToggleProps {
  starred: boolean;
  onChange: (starred: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarToggle({ starred, onChange, size = 'md' }: StarToggleProps) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      type="button"
      onClick={() => onChange(!starred)}
      className={`transition-all duration-200 hover:scale-110 active:scale-95 ${
        starred ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'text-slate-300 hover:text-amber-300'
      }`}
      title={starred ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    >
      <svg
        className={sizes[size]}
        viewBox="0 0 24 24"
        fill={starred ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={starred ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
