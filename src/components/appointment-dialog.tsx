'use client';
import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, LockKeyhole, X } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { hasValidLocalTime, isValidAppointment } from '@/lib/calendar';
export default function AppointmentDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Appointment>;
  onClose: () => void;
  onSave: (a: Appointment) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const record: Appointment = {
      id: initial.id || crypto.randomUUID(),
      provider: String(form.get('provider') || '').trim(),
      date: String(form.get('date')),
      time: String(form.get('time')),
      duration: Number(form.get('duration')),
    };
    if (!isValidAppointment(record)) {
      setError('Enter a provider, a valid date, and a valid time.');
      return;
    }
    if (!hasValidLocalTime(record)) {
      setError('This time does not exist due to daylight saving time. Choose another time.');
      return;
    }
    onSave(record);
    onClose();
  }
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="appointment-dialog"
      aria-labelledby="appointment-heading"
    >
      <div className="dialog-content">
        <button
          className="dialog-close icon-button"
          aria-label="Close appointment form"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="section-icon">
          <CalendarPlus size={22} />
        </span>
        <p className="eyebrow">YOUR PERSONAL CARE CALENDAR</p>
        <h2 id="appointment-heading">{initial.id ? 'Edit appointment' : 'Save an appointment'}</h2>
        <p className="dialog-intro">
          A little space to keep your plans together. This saves a personal record; it doesn’t book
          a clinic visit.
        </p>
        <form onSubmit={submit}>
          <label>
            Clinic or provider
            <input
              name="provider"
              required
              maxLength={100}
              placeholder="e.g. My gynecology clinic"
              defaultValue={initial.provider || ''}
              autoFocus
            />
          </label>
          <div className="form-row">
            <label>
              Date
              <input
                type="date"
                name="date"
                required
                min="1900-01-01"
                max="9999-12-31"
                defaultValue={initial.date || ''}
              />
            </label>
            <label>
              Time
              <input type="time" name="time" required defaultValue={initial.time || '09:00'} />
            </label>
          </div>
          <label>
            Duration
            <select name="duration" defaultValue={initial.duration || 30}>
              {[15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <p className="small-muted">
            All times are Eastern Time (America/New_York). Repeated fall-back times use the first
            occurrence.
          </p>
          <p className="privacy-note">
            <LockKeyhole size={14} />
            Stored on this browser only. Don’t add symptoms or medical details. Avoid shared
            devices.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" type="submit">
            {initial.id ? 'Save changes' : 'Save personal appointment'}
            <CalendarPlus size={16} />
          </button>
        </form>
      </div>
    </dialog>
  );
}
