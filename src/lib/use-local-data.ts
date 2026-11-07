'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { Appointment } from './types';
import { isValidAppointment } from './calendar';
const eventName = 'ellie-local-change';
const memory = new Map<string, string>();
let storageFailed = false;
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener('storage', callback);
  };
}
function read(key: string) {
  try {
    return memory.get(key) ?? window.localStorage.getItem(key) ?? '[]';
  } catch {
    return memory.get(key) ?? '[]';
  }
}
function write(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
    memory.delete(key);
  } catch {
    memory.set(key, raw);
    storageFailed = true;
  }
  window.dispatchEvent(new Event(eventName));
}
const emptySnapshot = () => '[]';
export function useLocalData() {
  const favoritesRaw = useSyncExternalStore(
    subscribe,
    () => read('ellie-favorites-v1'),
    emptySnapshot,
  );
  const appointmentsRaw = useSyncExternalStore(
    subscribe,
    () => read('ellie-appointments-v1'),
    emptySnapshot,
  );
  const failed = useSyncExternalStore(
    subscribe,
    () => storageFailed,
    () => false,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const favorites = useMemo<string[]>(() => {
    try {
      const x = JSON.parse(favoritesRaw);
      return Array.isArray(x) ? x.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }, [favoritesRaw]);
  const appointments = useMemo<Appointment[]>(() => {
    try {
      const x = JSON.parse(appointmentsRaw);
      return Array.isArray(x) ? x.filter(isValidAppointment) : [];
    } catch {
      return [];
    }
  }, [appointmentsRaw]);
  return {
    favorites,
    appointments,
    failed,
    ready,
    toggleFavorite(id: string) {
      write(
        'ellie-favorites-v1',
        favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id],
      );
    },
    saveAppointment(a: Appointment) {
      write('ellie-appointments-v1', [...appointments.filter((x) => x.id !== a.id), a]);
    },
    deleteAppointment(id: string) {
      write(
        'ellie-appointments-v1',
        appointments.filter((x) => x.id !== id),
      );
    },
    clearAll() {
      write('ellie-favorites-v1', []);
      write('ellie-appointments-v1', []);
    },
  };
}
