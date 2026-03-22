import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;          // ISO datetime or YYYY-MM-DD for all-day
  end: string;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
}

export type GCalStatus = 'disconnected' | 'connected' | 'loading' | 'error';

export function useGoogleCalendar(session: Session | null) {
  const [status, setStatus] = useState<GCalStatus>('disconnected');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const eventsCache = useRef<Record<string, CalendarEvent[]>>({});

  const enabled = !!(supabaseConfigured && session && GOOGLE_CLIENT_ID);

  // Check connection status on mount
  useEffect(() => {
    if (!enabled) return;

    supabase
      .from('google_tokens')
      .select('user_id')
      .eq('user_id', session!.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setStatus('disconnected');
          return;
        }
        setStatus(data ? 'connected' : 'disconnected');
      });
  }, [enabled, session]);

  // Call the edge function
  const callEdgeFunction = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body,
      });
      if (error) throw error;
      return data;
    },
    [],
  );

  // Start OAuth popup flow
  const connect = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[gcal] VITE_GOOGLE_CLIENT_ID not set');
      return;
    }

    // Build the redirect URI — use the current origin + /auth/google/callback
    const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}auth/google/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',        // Force consent to always get refresh token
      state: crypto.randomUUID(),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    // Open popup and listen for the redirect with the code
    const popup = window.open(authUrl, 'google-auth', 'width=500,height=700,popup=yes');
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    setStatus('loading');

    // Poll popup for the redirect URL containing the code
    const pollInterval = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(pollInterval);
          // Check if we connected successfully
          const { data } = await supabase
            .from('google_tokens')
            .select('user_id')
            .eq('user_id', session!.user.id)
            .maybeSingle();
          setStatus(data ? 'connected' : 'disconnected');
          return;
        }

        // Try to read the popup URL (will throw if cross-origin)
        const url = popup.location.href;
        if (url.includes('code=')) {
          clearInterval(pollInterval);
          popup.close();

          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (!code) {
            setStatus('error');
            return;
          }

          await callEdgeFunction({
            action: 'exchange',
            code,
            redirect_uri: redirectUri,
          });

          eventsCache.current = {};
          setStatus('connected');
        }
      } catch {
        // Cross-origin — popup hasn't redirected back yet, keep polling
      }
    }, 500);
  }, [session, callEdgeFunction]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await callEdgeFunction({ action: 'disconnect' });
      setStatus('disconnected');
      setEvents([]);
      eventsCache.current = {};
    } catch (err) {
      console.error('[gcal] disconnect error:', err);
    }
  }, [callEdgeFunction]);

  // Fetch events for a date range
  const fetchEvents = useCallback(
    async (dateMin: string, dateMax: string) => {
      if (status !== 'connected') return;

      const cacheKey = `${dateMin}:${dateMax}`;
      if (eventsCache.current[cacheKey]) {
        setEvents(eventsCache.current[cacheKey]);
        return;
      }

      setLoadingEvents(true);
      try {
        const data = await callEdgeFunction({
          action: 'events',
          date_min: dateMin,
          date_max: dateMax,
        });
        const fetched: CalendarEvent[] = data.events ?? [];
        eventsCache.current[cacheKey] = fetched;
        setEvents(fetched);
      } catch (err) {
        console.error('[gcal] fetch events error:', err);
        // If token is invalid, mark as disconnected
        if (String(err).includes('not connected') || String(err).includes('Token refresh failed')) {
          setStatus('disconnected');
        }
      } finally {
        setLoadingEvents(false);
      }
    },
    [status, callEdgeFunction],
  );

  // Get events for a specific day from the current cached events
  const getEventsForDate = useCallback(
    (dateKey: string): CalendarEvent[] => {
      return events.filter((e) => {
        const eventDate = e.start.slice(0, 10); // YYYY-MM-DD
        return eventDate === dateKey;
      });
    },
    [events],
  );

  return {
    enabled,
    status,
    events,
    loadingEvents,
    connect,
    disconnect,
    fetchEvents,
    getEventsForDate,
  };
}
