import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { Highlight, ZoomLevel, ReflectionRating } from '../types';
import { useLocalStorage } from './useLocalStorage';

const highlightKey = (level: ZoomLevel, date: string) => `${level}-${date}`;

export function useHighlights() {
  const [highlights, setHighlights] = useLocalStorage<Record<string, Highlight>>(
    'bujo-highlights',
    {},
  );

  const getHighlight = useCallback(
    (level: ZoomLevel, date: string): Highlight | undefined =>
      highlights[highlightKey(level, date)],
    [highlights],
  );

  const setHighlight = useCallback(
    (level: ZoomLevel, date: string, content: string, taskId?: string) => {
      const key = highlightKey(level, date);
      const existing = highlights[key];
      const now = new Date().toISOString();
      setHighlights((prev) => ({
        ...prev,
        [key]: {
          id: existing?.id ?? uuid(),
          content,
          level,
          date,
          taskId,
          reflection: existing?.reflection,
          updatedAt: now,
        },
      }));
    },
    [highlights, setHighlights],
  );

  const clearHighlight = useCallback(
    (level: ZoomLevel, date: string) => {
      const key = highlightKey(level, date);
      setHighlights((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [setHighlights],
  );

  const setReflection = useCallback(
    (level: ZoomLevel, date: string, rating: ReflectionRating, note?: string) => {
      const key = highlightKey(level, date);
      const now = new Date().toISOString();
      setHighlights((prev) => {
        const existing = prev[key];
        if (!existing) return prev;
        return {
          ...prev,
          [key]: {
            ...existing,
            reflection: { rating, note },
            updatedAt: now,
          },
        };
      });
    },
    [setHighlights],
  );

  return {
    highlights,
    setHighlights,
    getHighlight,
    setHighlight,
    clearHighlight,
    setReflection,
  };
}
