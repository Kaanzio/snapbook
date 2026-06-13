import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [prevOffset, setPrevOffset] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const toggleScrollDirection = () => {
      let scrollY = window.pageYOffset;
      if (scrollY === 0) {
        setScrollDirection('up');
      }
      
      // Throttle direction updates
      if (Math.abs(scrollY - prevOffset) < 10) {
         return;
      }

      if (scrollY > prevOffset && scrollY > 64) {
        setScrollDirection('down');
      } else if (scrollY < prevOffset) {
        setScrollDirection('up');
      }
      setPrevOffset(scrollY);
    };

    const onScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(toggleScrollDirection, 10);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [prevOffset]);

  return scrollDirection;
}
