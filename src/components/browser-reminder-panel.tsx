'use client';
import { Bell, BellOff, Info } from 'lucide-react';
import type { BrowserReminders } from '@/lib/use-browser-reminders';
export default function BrowserReminderPanel({ reminders }: { reminders: BrowserReminders }) {
  const active = reminders.enabled && reminders.permission === 'granted';
  return (
    <section className="reminder-panel surface" aria-labelledby="reminder-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A LITTLE NUDGE TO CARE FOR YOURSELF</p>
          <h2 id="reminder-heading">Appointment reminders</h2>
        </div>
        {active ? <Bell size={21} /> : <BellOff size={21} />}
      </div>
      <p>
        Choose a reminder time when saving an appointment. Apple / .ics exports include that
        reminder. For Google, choose your notification on Google’s event page.
      </p>
      <div className="browser-reminder-actions">
        <span className="personal-badge">
          Browser reminders: {active ? 'enabled while Ellie is open' : 'off'}
        </span>
        {active ? (
          <>
            <button className="secondary-button" onClick={reminders.test}>
              Send test reminder
            </button>
            <button className="text-button" onClick={reminders.disable}>
              Disable browser reminders
            </button>
          </>
        ) : (
          <button
            className="secondary-button"
            onClick={reminders.enable}
            disabled={reminders.permission === 'unsupported' || reminders.permission === 'unknown'}
          >
            Enable browser reminders
          </button>
        )}
      </div>
      {reminders.permission === 'unsupported' && (
        <p>Tab-based notifications are unavailable in this browser. Calendar exports still work.</p>
      )}
      {reminders.notice && <p role="status">{reminders.notice}</p>}
      <p className="reminder-limits">
        <Info size={14} />
        Browser reminders are best effort: Ellie must stay open. Closed or suspended tabs, mobile
        browser limits, Do Not Disturb and device settings can prevent or delay delivery. No email,
        SMS, or background push is configured.
      </p>
    </section>
  );
}
