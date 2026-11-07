'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Appointment } from './types';
import { dueReminders, reminderKey } from './reminders';
const preferenceKey = 'ellie-browser-reminders-v1';
const ledgerKey = 'ellie-reminders-sent-v1';
const changeEvent = 'ellie-reminder-preference';
let volatilePreference: boolean | undefined;
const memorySent = new Set<string>();
function subscribe(callback: () => void) {
  window.addEventListener('focus', callback);
  window.addEventListener('storage', callback);
  window.addEventListener(changeEvent, callback);
  document.addEventListener('visibilitychange', callback);
  return () => {
    window.removeEventListener('focus', callback);
    window.removeEventListener('storage', callback);
    window.removeEventListener(changeEvent, callback);
    document.removeEventListener('visibilitychange', callback);
  };
}
function permissionSnapshot() {
  return window.isSecureContext && typeof window.Notification === 'function'
    ? Notification.permission
    : 'unsupported';
}
function enabledSnapshot() {
  try {
    return volatilePreference ?? localStorage.getItem(preferenceKey) === 'true';
  } catch {
    return volatilePreference ?? false;
  }
}
function savePreference(value: boolean) {
  try {
    localStorage.setItem(preferenceKey, String(value));
    volatilePreference = undefined;
  } catch {
    volatilePreference = value;
  }
  window.dispatchEvent(new Event(changeEvent));
}
function sentReminders() {
  const sent = new Set(memorySent);
  try {
    const data = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    if (Array.isArray(data)) data.filter((v) => typeof v === 'string').forEach((v) => sent.add(v));
  } catch {
    /* Session deduplication still works when storage is unavailable. */
  }
  return sent;
}
function remember(key: string) {
  const sent = sentReminders();
  sent.add(key);
  memorySent.add(key);
  try {
    localStorage.setItem(ledgerKey, JSON.stringify([...sent].slice(-500)));
  } catch {
    /* Browser reminders remain best effort for this tab. */
  }
}
function notify(onOpenCare: () => void, test = false, tag?: string) {
  try {
    const notification = new Notification(test ? 'Ellie test reminder' : 'Ellie reminder', {
      body: test
        ? 'This is a test. Your device settings determine whether notifications appear.'
        : 'Your saved appointment is coming up. Open My Care to review it.',
      tag: test ? 'ellie-test-reminder' : tag,
    });
    notification.onclick = () => {
      window.focus();
      onOpenCare();
      notification.close();
    };
    // Do not expose provider names or other medical context on the device's lock screen.
    return notification;
  } catch {
    return null;
  }
}

export function useBrowserReminders(appointments: Appointment[], onOpenCare: () => void) {
  const permission = useSyncExternalStore(subscribe, permissionSnapshot, () => 'unknown');
  const enabled = useSyncExternalStore(subscribe, enabledSnapshot, () => false);
  const [notice, setNotice] = useState('');
  const openCare = useRef(onOpenCare);
  useEffect(() => {
    openCare.current = onOpenCare;
  }, [onOpenCare]);
  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    function check() {
      if (Notification.permission !== 'granted') return;
      for (const appointment of dueReminders(appointments, Date.now(), sentReminders())) {
        const notification = notify(() => openCare.current(), false, reminderKey(appointment));
        if (!notification) {
          savePreference(false);
          setNotice('This browser cannot send reminders from a tab. Use calendar exports instead.');
          break;
        }
        remember(reminderKey(appointment));
      }
    }
    const initial = window.setTimeout(check, 0);
    const timer = window.setInterval(check, 30000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [appointments, enabled, permission]);
  async function enable() {
    if (permission === 'unsupported' || permission === 'unknown') {
      setNotice(
        'Browser reminders are not supported here. Use Google Calendar or an Apple / .ics export.',
      );
      return;
    }
    try {
      const result =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      savePreference(result === 'granted');
      setNotice(
        result === 'granted'
          ? 'Browser reminders are enabled while Ellie is open. Use the test button to check your device.'
          : 'Notifications were not allowed. You can allow them in browser settings or use a calendar export.',
      );
    } catch {
      savePreference(false);
      setNotice('Your browser could not enable reminders. Use a calendar export instead.');
    }
  }
  return {
    permission,
    enabled,
    notice,
    enable,
    disable() {
      savePreference(false);
      setNotice('Browser reminders are off. Existing reminders in your calendar are unchanged.');
    },
    test() {
      if (permissionSnapshot() !== 'granted') {
        setNotice('Enable browser reminders first.');
        return;
      }
      const notification = notify(() => openCare.current(), true);
      setNotice(
        notification
          ? 'Test reminder requested. Check your device notifications; display depends on system settings.'
          : 'This browser cannot send reminders from a tab. Use calendar exports instead.',
      );
      if (notification) window.setTimeout(() => notification.close(), 10000);
      else savePreference(false);
    },
    clear() {
      savePreference(false);
      memorySent.clear();
      try {
        localStorage.removeItem(ledgerKey);
        localStorage.removeItem(preferenceKey);
      } catch {
        /* Session preference was already cleared. */
      }
      setNotice('');
    },
  };
}
export type BrowserReminders = ReturnType<typeof useBrowserReminders>;
