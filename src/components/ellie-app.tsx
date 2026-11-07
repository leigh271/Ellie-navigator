'use client';
import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Heart,
  MapPin,
  Search,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { providers } from '@/lib/providers';
import { useLocalData } from '@/lib/use-local-data';
import { useBrowserReminders } from '@/lib/use-browser-reminders';
import FindCare from './find-care';
import ProviderDetails from './provider-details';
import MyCare from './my-care';
import AskEllie from './ask-ellie';
import Resources from './resources';
import AppointmentDialog from './appointment-dialog';
type Tab = 'find' | 'care' | 'ask' | 'resources';
const tabs = [
  { id: 'find' as const, label: 'Find Care', icon: Search },
  { id: 'care' as const, label: 'My Care', icon: CalendarDays },
  { id: 'ask' as const, label: 'Ask Ellie', icon: MessageCircle },
  { id: 'resources' as const, label: 'Resources', icon: BookOpen },
];
export default function EllieApp({ aiAvailable }: { aiAvailable: boolean }) {
  const [tab, setTab] = useState<Tab>('find');
  const [selected, setSelected] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Partial<Appointment> | null>(null);
  const [toast, setToast] = useState('');
  const local = useLocalData();
  const reminders = useBrowserReminders(local.appointments, () => navigate('care'));
  const detailProvider = providers.find((p) => p.id === detailId);
  function navigate(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 5000);
  }
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <button className="brand" onClick={() => navigate('find')} aria-label="Ellie home">
          <span className="wordmark">Ellie</span>
          <span className="brand-divider" />
          <span className="brand-caption">
            A LITTLE CLOSER
            <br />
            TO BETTER CARE
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => navigate(t.id)}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
        <button className="header-saved" onClick={() => navigate('care')}>
          <Heart size={17} />
          <span>My saved care</span>
          {local.favorites.length > 0 && (
            <span className="count-badge">{local.favorites.length}</span>
          )}
        </button>
      </header>
      <main id="main">
        <section className="page-intro">
          <div>
            <p className="eyebrow">
              <span />
              YOUR HEALTH. YOUR PACE. YOUR ELLIE.
            </p>
            <h1>
              {tab === 'find' ? (
                <>
                  Women’s health,
                  <br className="mobile-break" /> <span>closer to you.</span>
                </>
              ) : tab === 'care' ? (
                <>
                  A little care,<span> just for you.</span>
                </>
              ) : tab === 'ask' ? (
                <>
                  A softer way<span> to find your next step.</span>
                </>
              ) : (
                <>
                  Good information.<span> More confidence.</span>
                </>
              )}
            </h1>
            <p>
              {tab === 'find'
                ? 'Find care that fits your life. Feel supported at every step.'
                : tab === 'care'
                  ? 'Your favorite providers and personal appointments, all in one thoughtful space.'
                  : tab === 'ask'
                    ? 'A friendly guide to the practical side of finding care.'
                    : 'Thoughtful starting points for understanding your health.'}
            </p>
          </div>
          <div className="region-tag">
            <MapPin size={15} />
            <span>Made for South Florida</span>
            <span className="region-tag-dot" />
          </div>
        </section>
        {local.failed && (
          <p className="storage-warning" role="alert">
            Browser storage is unavailable. Your changes will last only in this tab; export
            appointments before leaving.
          </p>
        )}
        <div hidden={tab !== 'find'}>
          <FindCare
            selected={selected}
            onSelect={setSelected}
            favorites={local.favorites}
            onFavorite={local.toggleFavorite}
            onAppointment={(p) => setAppointment({ provider: p.name })}
            onDetails={setDetailId}
            onAsk={() => navigate('ask')}
          />
        </div>
        {tab === 'care' && (
          <MyCare
            onProviderDetails={setDetailId}
            reminders={reminders}
            appointments={local.appointments}
            favorites={local.favorites}
            onEdit={setAppointment}
            onDelete={(id) => {
              local.deleteAppointment(id);
              notify('Personal appointment deleted.');
            }}
            onFavorite={local.toggleFavorite}
            onFind={() => navigate('find')}
            onClear={() => {
              local.clearAll();
              reminders.clear();
              notify('Local Ellie records cleared.');
            }}
          />
        )}
        {tab === 'ask' && (
          <div className="ask-layout">
            <AskEllie aiAvailable={aiAvailable} />
            <aside className="ask-side">
              <span className="section-icon">
                <Heart size={24} />
              </span>
              <h2>A guide in your corner.</h2>
              <p>
                From figuring out what to ask a clinic to keeping your calendar organized, Ellie is
                here for the next small step.
              </p>
              <ul>
                <li>
                  <Check size={15} />
                  Questions to ask about insurance and costs
                </li>
                <li>
                  <Check size={15} />
                  Official care sources in South Florida
                </li>
                <li>
                  <Check size={15} />
                  Help managing your personal care calendar
                </li>
              </ul>
              <div className="care-note">
                <ShieldCheck size={19} />
                <p>
                  Ellie can’t diagnose, recommend treatment, or confirm a booking. For individual
                  care, talk with a qualified clinician. In an emergency, call 911.
                </p>
              </div>
              <button className="text-button" onClick={() => navigate('resources')}>
                Explore health resources
                <ArrowRight size={15} />
              </button>
            </aside>
          </div>
        )}
        {tab === 'resources' && <Resources />}
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-wordmark">Ellie</span>
          <span>A little guidance. A lot of care.</span>
        </div>
        <p>
          An initiative of <strong>Flowers for Women</strong>
        </p>
        <span className="footer-region">Broward & Miami-Dade, Florida</span>
      </footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => navigate(t.id)}
          >
            <t.icon size={20} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      {detailProvider && (
        <ProviderDetails
          provider={detailProvider}
          saved={local.favorites.includes(detailProvider.id)}
          onSave={() => local.toggleFavorite(detailProvider.id)}
          onClose={() => setDetailId(null)}
          onAppointment={() => {
            setDetailId(null);
            setAppointment({ provider: detailProvider.name });
          }}
        />
      )}
      {appointment && (
        <AppointmentDialog
          initial={appointment}
          onClose={() => setAppointment(null)}
          onSave={(a) => {
            local.saveAppointment(a);
            navigate('care');
            notify('Personal appointment saved. Confirm your booking directly with the clinic.');
          }}
        />
      )}
      <div className={`toast ${toast ? 'visible' : ''}`} role="status">
        {toast && (
          <>
            <Check size={17} />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
