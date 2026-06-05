'use client';

import Link from 'next/link';

interface DashboardStatsProps {
  totalPhotos: number;
  totalCollections: number;
  totalWatchlist: number;
}

export default function DashboardStats({ totalPhotos, totalCollections, totalWatchlist }: DashboardStatsProps) {
  const stats = [
    {
      id: 'photos',
      label: 'Anılar',
      value: totalPhotos,
      href: '/',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 group-hover:[color:var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'watchbook',
      label: 'Kırmızı Perde',
      value: totalWatchlist,
      href: '/watchlist',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 group-hover:[color:var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      id: 'collections',
      label: 'Koleksiyonlar',
      value: totalCollections,
      href: '/collections',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 group-hover:[color:var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-5 w-full animate-[fade-in_0.7s_ease-out]">
      {stats.map((stat) => (
        <Link 
          key={stat.id} 
          href={stat.href}
          className="relative overflow-hidden group flex flex-col justify-between p-4 md:p-6 lg:p-7 rounded-3xl border transition-all duration-500 hover:border-white/20"
          style={{ 
            background: 'var(--bg-card)', 
            borderColor: 'var(--border-primary)',
          }}
        >
          {/* Hover parlaması (Subtle Glow) */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none" style={{ background: 'var(--accent)' }} />
          
          <div className="flex justify-between items-start w-full mb-4 md:mb-8">
            <span 
              className="text-[10px] md:text-xs font-semibold uppercase tracking-widest mt-1" 
              style={{ color: 'var(--text-tertiary)' }}
            >
              {stat.label}
            </span>
            <div 
              className="transition-transform duration-500 group-hover:scale-110" 
              style={{ color: 'var(--text-tertiary)' }}
            >
              {stat.icon}
            </div>
          </div>
          
          <div className="flex items-end w-full">
            <span 
              className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter transition-colors duration-500" 
              style={{ color: 'var(--text-primary)' }}
            >
              {stat.value}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
