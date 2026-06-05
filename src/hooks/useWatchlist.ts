'use client';

import { useState, useEffect } from 'react';
import { WatchItem, WatchStatus, WatchItemType, CustomWatchList } from '@/types';
import { 
  getAllWatchItems, createWatchItem, updateWatchItem, deleteWatchItem, notifyDataChange, savePhoto, deleteLocalPhoto,
  getAllCustomLists, createCustomList, deleteCustomList, updateCustomList
} from '@/lib/indexeddb';
import { v4 as uuidv4 } from 'uuid';

export function useWatchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomWatchList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [data, lists] = await Promise.all([
        getAllWatchItems(),
        getAllCustomLists()
      ]);
      if (isMounted) {
        setItems(data);
        // Apply saved order if available
        try {
          const savedOrder = localStorage.getItem('snapbook-list-order');
          if (savedOrder) {
            const orderIds: string[] = JSON.parse(savedOrder);
            const ordered = [...lists].sort((a, b) => {
              const ai = orderIds.indexOf(a.id);
              const bi = orderIds.indexOf(b.id);
              if (ai === -1) return 1;
              if (bi === -1) return -1;
              return ai - bi;
            });
            setCustomLists(ordered);
          } else {
            setCustomLists(lists);
          }
        } catch {
          setCustomLists(lists);
        }
        setLoading(false);
      }
    }

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('snapbook-watchlist-changed', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('snapbook-watchlist-changed', handleUpdate);
    };
  }, []);

  async function addItem(
    data: Omit<WatchItem, 'id' | 'created_at' | 'updated_at'>,
    posterFile?: File | Blob
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    const item: WatchItem = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    await createWatchItem(item);

    // Save poster image using photo store (reuse existing infrastructure)
    if (posterFile) {
      await savePhoto(`watch-poster-${id}`, posterFile);
    }

    notifyDataChange('watchlist');
    return id;
  }

  async function editItem(id: string, updates: Partial<Omit<WatchItem, 'id' | 'created_at'>>, posterFile?: File | Blob): Promise<void> {
    await updateWatchItem(id, updates);

    if (posterFile) {
      await savePhoto(`watch-poster-${id}`, posterFile);
    }

    notifyDataChange('watchlist');
  }

  async function removeItem(id: string): Promise<void> {
    await deleteWatchItem(id);
    // Also delete the poster image
    try {
      await deleteLocalPhoto(`watch-poster-${id}`);
    } catch {
      // Poster might not exist
    }
    notifyDataChange('watchlist');
  }

  async function updateStatus(id: string, status: WatchStatus): Promise<void> {
    await updateWatchItem(id, { status });
    notifyDataChange('watchlist');
  }

  async function updateProgress(id: string, season: number, episode: number): Promise<void> {
    await updateWatchItem(id, { currentSeason: season, currentEpisode: episode });
    notifyDataChange('watchlist');
  }

  function getFilteredItems(filters: { status?: WatchStatus; type?: WatchItemType; searchQuery?: string }): WatchItem[] {
    return items.filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q)) ||
          item.genre?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  // --- CUSTOM LISTS METHODS ---

  async function addCustomList(name: string): Promise<void> {
    if (!name.trim()) return;
    const list: CustomWatchList = {
      id: uuidv4(),
      name: name.trim(),
      created_at: new Date()
    };
    await createCustomList(list);
    notifyDataChange('watchlist');
  }

  async function removeCustomList(id: string): Promise<void> {
    await deleteCustomList(id);
    
    // Cleanup listIds from items
    const itemsInList = items.filter(i => i.listIds?.includes(id));
    for (const item of itemsInList) {
      const updatedListIds = item.listIds?.filter(lId => lId !== id) || [];
      await updateWatchItem(item.id, { listIds: updatedListIds });
    }
    
    notifyDataChange('watchlist');
  }

  async function editCustomList(id: string, name: string): Promise<void> {
    if (!name.trim()) return;
    await updateCustomList(id, name.trim());
    notifyDataChange('watchlist');
  }

  async function toggleItemInList(itemId: string, listId: string): Promise<void> {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentListIds = item.listIds || [];
    const newListIds = currentListIds.includes(listId)
      ? currentListIds.filter(id => id !== listId)
      : [...currentListIds, listId];
      
    await updateWatchItem(itemId, { listIds: newListIds });
    notifyDataChange('watchlist');
  }

  function reorderCustomLists(fromIndex: number, toIndex: number): void {
    setCustomLists(prev => {
      const newLists = [...prev];
      const [moved] = newLists.splice(fromIndex, 1);
      newLists.splice(toIndex, 0, moved);
      // Persist order to localStorage
      try {
        localStorage.setItem('snapbook-list-order', JSON.stringify(newLists.map(l => l.id)));
      } catch {}
      return newLists;
    });
  }

  return {
    items,
    customLists,
    loading,
    addItem,
    editItem,
    removeItem,
    updateStatus,
    updateProgress,
    getFilteredItems,
    addCustomList,
    editCustomList,
    removeCustomList,
    toggleItemInList,
    reorderCustomLists,
  };
}
