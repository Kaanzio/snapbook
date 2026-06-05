// SVG icon renderers for watchlist status and type icons

interface IconProps {
  className?: string;
}

export function PlayIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14.72a1 1 0 001.52.85l11-7.36a1 1 0 000-1.7l-11-7.36A1 1 0 008 5.14z" />
    </svg>
  );
}

export function CheckIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function BookmarkIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  );
}

export function XIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function FilmIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.744h-.753v8.25h7.498v-8.25h-.753m-7.497 0a.5.5 0 01.5-.5h8.497a.5.5 0 01.5.5v8.25h-9.497v-8.25zM6.75 12h10.5m-10.5 0v7.5h10.5V12m-10.5 0H3.75m13.5 0h2.25M3.75 12V5.25m0 6.75h2.25M20.25 5.25v6.75m0-6.75H17.25M3.75 5.25H6M20.25 5.25h-2.25" />
    </svg>
  );
}

export function TvIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

/** 'play' | 'check' | 'bookmark' | 'x' | 'film' | 'tv' */
export function WatchStatusIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'play':     return <PlayIcon className={className} />;
    case 'check':    return <CheckIcon className={className} />;
    case 'bookmark': return <BookmarkIcon className={className} />;
    case 'x':        return <XIcon className={className} />;
    case 'film':     return <FilmIcon className={className} />;
    case 'tv':       return <TvIcon className={className} />;
    default:         return null;
  }
}
