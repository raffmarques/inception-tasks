import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { BujoList, ListItem } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useLists() {
  const [lists, setLists] = useLocalStorage<BujoList[]>('bujo-lists', []);

  const addList = useCallback((name: string) => {
    const list: BujoList = {
      id: uuid(),
      name,
      items: [],
      createdAt: new Date().toISOString(),
    };
    setLists((prev) => [...prev, list]);
  }, [setLists]);

  const removeList = useCallback((listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }, [setLists]);

  const renameList = useCallback((listId: string, name: string) => {
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, name } : l));
  }, [setLists]);

  const addItem = useCallback((listId: string, content: string) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const item: ListItem = { id: uuid(), content, status: 'open', order: l.items.length };
      return { ...l, items: [...l.items, item] };
    }));
  }, [setLists]);

  const removeItem = useCallback((listId: string, itemId: string) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.filter((i) => i.id !== itemId) };
    }));
  }, [setLists]);

  const toggleItemStatus = useCallback((listId: string, itemId: string) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      return {
        ...l,
        items: l.items.map((i) =>
          i.id === itemId ? { ...i, status: i.status === 'open' ? 'completed' : 'open' } : i
        ),
      };
    }));
  }, [setLists]);

  return { lists, addList, removeList, renameList, addItem, removeItem, toggleItemStatus };
}
