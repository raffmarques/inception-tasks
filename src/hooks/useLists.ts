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
    const item: ListItem = { id: uuid(), content, order: 0 };
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const items = [...l.items, { ...item, order: l.items.length }] as ListItem[];
      return { ...l, items };
    }));
  }, [setLists]);

  const removeItem = useCallback((listId: string, itemId: string) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.filter((i) => i.id !== itemId) };
    }));
  }, [setLists]);

  return { lists, addList, removeList, renameList, addItem, removeItem };
}
