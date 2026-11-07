'use client';
import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Download,
  Pencil,
  Trash2,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { createICS, googleCalendarURL, appointmentUTC } from '@/lib/calendar';
import { providers } from '@/lib/providers';
import ProviderCard from './provider-card';
function downloadICS(a: Appointment) {
  const url = URL.createObjectURL(
    new Blob([createICS(a)], { type: 'text/calendar;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ellie-appointment.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function MyCare({
  appointments,
  favorites,
  onEdit,
  onDelete,
  onFavorite,
  onFind,
  onClear,
}: {
  appointments: Appointment[];
  favorites: string[];
  onEdit: (a: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onFind: () => void;
  onClear: () => void;
}) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month] = today.split('-').map(Number);
  const [view, setView] = useState({ year, month: month - 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const first = new Date(Date.UTC(view.year, view.month, 1));
  const days = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const title = first.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  function move(delta: number) {
    const d = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
    setSelected(null);
  }
  const sorted = [...appointments].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );
  const [now] = useState(() => Date.now());
  const shown = sorted.filter((a) =>
    selected ? a.date === selected : appointmentUTC(a).getTime() + a.duration * 60000 >= now,
  );
  const saved = providers.filter((p) => favorites.includes(p.id));
  return (
    <div className="my-care-layout">
      <section className="calendar-panel surface">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE SPACE FOR YOURSELF</p>
            <h2>Your care calendar</h2>
          </div>
          <button className="primary-button" onClick={() => onEdit({})}>
            <Plus size={16} />
            Add appointment
          </button>
        </div>
        <div className="calendar-toolbar">
          <h3>{title}</h3>
          <div>
            <button
              className="text-button"
              onClick={() => {
                setView({ year, month: month - 1 });
                setSelected(today);
              }}
            >
              Today
            </button>
            <button className="icon-button" aria-label="Previous month" onClick={() => move(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="icon-button" aria-label="Next month" onClick={() => move(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span className="weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: first.getUTCDay() }).map((_, i) => (
            <div key={`blank-${i}`} className="calendar-blank" />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const date = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
            const count = appointments.filter((a) => a.date === date).length;
            return (
              <button
                key={date}
                className={`calendar-day ${date === today ? 'today' : ''} ${selected === date ? 'selected' : ''}`}
                onClick={() => setSelected(selected === date ? null : date)}
                aria-label={`${date}, ${count} appointments`}
                aria-pressed={selected === date}
              >
                <span>{i + 1}</span>
                {count > 0 && (
                  <span className="calendar-event-dot">
                    <i />
                    {count > 1 ? count : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="calendar-caption">
          <span className="live-dot" />
          Personal appointments · Eastern Time
        </p>
      </section>
      <aside className="appointments-panel surface">
        <div className="section-heading">
          <h3>{selected ? 'Selected day' : 'Coming up'}</h3>
          <CalendarDays size={20} />
        </div>
        {selected && (
          <button className="text-button" onClick={() => setSelected(null)}>
            Show all upcoming appointments
          </button>
        )}
        {shown.length === 0 ? (
          <div className="empty-care">
            <span className="section-icon">
              <CalendarDays size={26} />
            </span>
            <h3>A moment for your health.</h3>
            <p>
              {selected
                ? 'No personal appointments saved for this day.'
                : 'Your upcoming appointments will feel right at home here.'}
            </p>
            <button
              className="secondary-button"
              onClick={() => onEdit({ date: selected || today })}
            >
              <Plus size={15} />
              Save an appointment
            </button>
          </div>
        ) : (
          <div className="appointment-list">
            {shown.map((a) => (
              <article key={a.id} className="appointment-item">
                <div className="appointment-date">
                  <strong>{a.date.slice(8)}</strong>
                  <span>
                    {new Date(`${a.date}T12:00:00Z`).toLocaleDateString('en-US', {
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
                <div className="appointment-info">
                  <h4>{a.provider}</h4>
                  <p>
                    {a.time} ET · {a.duration} min
                  </p>
                  <span className="personal-badge">Personal record · not a booking</span>
                  <div className="appointment-actions">
                    <a
                      href={googleCalendarURL(a)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Add ${a.provider} to Google Calendar`}
                    >
                      Google <ArrowUpRight size={12} />
                    </a>
                    <button
                      onClick={() => downloadICS(a)}
                      aria-label={`Export ${a.provider} to Apple Calendar`}
                    >
                      <Download size={12} />
                      Apple / .ics
                    </button>
                    <button onClick={() => onEdit(a)} aria-label={`Edit ${a.provider}`}>
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a.id)}
                      aria-label={`Delete ${a.provider}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {confirmDelete === a.id && (
                    <div className="delete-confirm">
                      <p>Delete this personal record?</p>
                      <button
                        onClick={() => {
                          onDelete(a.id);
                          setConfirmDelete(null);
                        }}
                      >
                        Delete record
                      </button>
                      <button onClick={() => setConfirmDelete(null)}>Keep it</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="care-note">
          <ShieldCheck size={17} />
          <p>
            Contact your clinic to book or change an appointment. Calendar exports don’t send
            booking requests or reminders.
          </p>
        </div>
      </aside>
      <section className="favorites-section surface">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CARE YOU CAN COME BACK TO</p>
            <h2>
              Saved providers <span className="count-badge">{saved.length}</span>
            </h2>
          </div>
          <Heart size={22} />
        </div>
        {saved.length ? (
          <div className="favorites-grid">
            {saved.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                selected={false}
                saved
                onSelect={onFind}
                onSave={() => onFavorite(p.id)}
                onAppointment={() => onEdit({ provider: p.name })}
              />
            ))}
          </div>
        ) : (
          <div className="favorites-empty">
            <p>Tap a provider’s heart in Find Care to keep them here.</p>
            <button className="text-button" onClick={onFind}>
              Explore care options <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </section>
      <div className="local-data-note">
        <p>
          <ShieldCheck size={15} />
          Your records stay in this browser. They aren’t synced, encrypted by Ellie, or backed up.
        </p>
        {clearConfirm ? (
          <span>
            Delete all local Ellie records?{' '}
            <button
              className="text-button"
              onClick={() => {
                onClear();
                setClearConfirm(false);
              }}
            >
              Delete all
            </button>
            <button className="text-button" onClick={() => setClearConfirm(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button className="text-button" onClick={() => setClearConfirm(true)}>
            Clear my local data
          </button>
        )}
      </div>
    </div>
  );
}
