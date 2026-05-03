import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { getCustomCategories } from '@/lib/indexeddb';
import { CategoryInfo } from '@/types';
import { usePreferences } from '@/components/providers/PreferencesProvider';

export function useCategories() {
  const { prefs } = usePreferences();
  const [customCategories, setCustomCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const customCats = await getCustomCategories();
      if (!cancelled) {
        setCustomCategories(customCats);
        setLoading(false);
      }
    }

    load();

    const handleUpdate = () => load();
    window.addEventListener('snapbook-categories-changed', handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('snapbook-categories-changed', handleUpdate);
    };
  }, []);

  const allCategories = useMemo(() => {
    return [...CATEGORIES, ...customCategories];
  }, [customCategories]);

  const categories = useMemo(() => {
    return allCategories.filter(c => !prefs.hiddenCategories?.includes(c.key));
  }, [allCategories, prefs.hiddenCategories]);

  const getCategoryInfo = (key: string): CategoryInfo => {
    return allCategories.find(c => c.key === key) || allCategories[allCategories.length - 1];
  };

  return { categories, allCategories, getCategoryInfo, loading };
}
