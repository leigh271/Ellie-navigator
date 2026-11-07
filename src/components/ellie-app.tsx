'use client';
import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  List,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  MessageCircle,
  X,
  ShieldCheck,
  Flower2,
} from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { services } from '@/lib/types';
import { searchCareProviders, providers } from '@/lib/providers';
import directorySources from '@/data/directory-sources.json';
import { useLocalData } from '@/lib/use-local-data';
import { useBrowserReminders } from '@/lib/use-browser-reminders';
import CareMap from './care-map';
import ProviderCard from './provider-card';
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
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [insurance, setInsurance] = useState('');
  const [affordability, setAffordability] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileMap, setMobileMap] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [appointment, setAppointment] = useState<Partial<Appointment> | null>(null);
  const [toast, setToast] = useState('');
  const local = useLocalData();
  const reminders = useBrowserReminders(local.appointments, () => navigate('care'));
  const searchResults = useMemo(
    () => searchCareProviders(providers, { location, service, insurance, affordability }),
    [location, service, insurance, affordability],
  );
  const matches = useMemo(
    () => [...searchResults.exact, ...searchResults.nearby].filter(
      (p) => !savedOnly || local.favorites.includes(p.id),
    ),
    [searchResults, savedOnly, local.favorites],
  );
  const exactIds = useMemo(() => new Set(searchResults.exact.map((p) => p.id)), [searchResults]);
  const onSelect = useCallback((id: string) => {
    setSelected(id);
    setMobileMap(false);
    requestAnimationFrame(() =>
      document
        .getElementById(`provider-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    );
  }, []);
  function navigate(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 5000);
  }
  function reset() {
    setLocation('');
    setService('');
    setInsurance('');
    setAffordability('');
    setSavedOnly(false);
  }
  const hasFilters = Boolean(location || service || insurance || affordability || savedOnly);
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
        {tab === 'find' && (
          <>
            <section className="search-section" aria-label="Filter care providers">
              <div className="search-bar">
                <label className="location-field">
                  <MapPin size={18} />
                  <span>
                    <span className="field-label">LOCATION</span>
                    <input
                      aria-label="Location"
                      placeholder="e.g. Fort Lauderdale, FL"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </span>
                </label>
                <label className="service-field">
                  <Heart size={18} />
                  <span>
                    <span className="field-label">WHAT BRINGS YOU HERE?</span>
                    <select
                      aria-label="Healthcare service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      <option value="">Explore all services</option>
                      {services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </span>
                  <ChevronDown size={14} />
                </label>
                <label className="insurance-field">
                  <ShieldCheck size={18} />
                  <span>
                    <span className="field-label">INSURANCE PLAN NAME</span>
                    <input
                      aria-label="Insurance plan"
                      placeholder="Optional — all plans"
                      aria-describedby="insurance-help"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                    />
                  </span>
                </label>
                <button
                  className="primary-button search-button"
                  onClick={() => {
                    setSelected(matches[0]?.id ?? null);
                    document
                      .getElementById('care-results')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  <Search size={17} />
                  <span>Find care</span>
                </button>
              </div>
              <p id="insurance-help" className="insurance-help">
                Insurance is optional. Leave blank to see all matching clinics. Never enter your member ID or policy number.
                Confirm coverage with the clinic.
              </p>
              <div className="filter-row">
                <div className="service-chips">
                  <button
                    className={`filter-chip ${!service ? 'selected' : ''}`}
                    onClick={() => setService('')}
                  >
                    All care
                  </button>
                  {services.slice(0, 4).map((s) => (
                    <button
                      className={`filter-chip ${service === s ? 'selected' : ''}`}
                      key={s}
                      onClick={() => setService(service === s ? '' : s)}
                    >
                      {s === 'Annual gynecology'
                        ? 'Annual wellness'
                        : s === 'Pap / HPV screening'
                          ? 'Pap & HPV screening'
                          : s}
                    </button>
                  ))}
                </div>
                <button
                  className={`filter-chip more-filters ${moreFilters ? 'selected' : ''}`}
                  aria-expanded={moreFilters}
                  onClick={() => setMoreFilters(!moreFilters)}
                >
                  <SlidersHorizontal size={14} />
                  Filters{affordability && <span className="filter-dot" />}
                </button>
              </div>
              {moreFilters && (
                <div className="expanded-filters">
                  <label className="mobile-insurance">
                    Insurance plan name
                    <input
                      aria-label="Insurance plan on mobile"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      placeholder="Optional — all plans"
                      aria-describedby="insurance-help"
                    />
                  </label>
                  <label>
                    Affordability
                    <select
                      aria-label="Affordability"
                      value={affordability}
                      onChange={(e) => setAffordability(e.target.value)}
                    >
                      <option value="">All cost options</option>
                      <option value="sliding-scale">Source-listed sliding fee scale</option>
                    </select>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={savedOnly}
                      onChange={(e) => setSavedOnly(e.target.checked)}
                    />
                    Saved providers only
                  </label>
                  <p>
                    Insurance filters match documented plans only. No match doesn’t mean a clinic
                    won’t accept your plan.
                  </p>
                </div>
              )}
            </section>
            <div className="discovery-layout">
              <section
                className={`results-panel ${mobileMap ? 'mobile-hidden' : ''}`}
                id="care-results"
                aria-label="Care results"
              >
                <div className="results-heading">
                  <div>
                    <h2>{providers.length ? 'Care near you' : 'Start with trusted sources'}</h2>
                    <p aria-live="polite">
                      {providers.length
                        ? `${matches.length} source-reviewed ${matches.length === 1 ? 'provider' : 'providers'}`
                        : 'Official directories · Broward & Miami-Dade'}
                    </p>
                  </div>
                  <span className="results-count">
                    {providers.length ? matches.length : <ShieldCheck size={17} />}
                  </span>
                </div>
                {hasFilters && (
                  <div className="active-filter-row">
                    <span>{matches.length} reviewed matches</span>
                    <button className="text-button" onClick={reset}>
                      Clear filters
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="provider-scroll">
                  {matches.map((p) => (
                    <div key={p.id}>
                      {!exactIds.has(p.id) && (
                        <p className="small-muted" style={{ margin: '8px 0' }}>
                          Nearby alternative · outside your exact location
                        </p>
                      )}
                    <ProviderCard
                      provider={p}
                      selected={selected === p.id}
                      saved={local.favorites.includes(p.id)}
                      onSelect={() => onSelect(p.id)}
                      onSave={() => local.toggleFavorite(p.id)}
                      onAppointment={() => setAppointment({ provider: p.name })}
                    />
                    </div>
                  ))}
                  {!matches.length && providers.length > 0 && (
                    <div className="empty-care">
                      <Search size={25} />
                      <h3>No reviewed matches yet.</h3>
                      <p>
                        No verified clinics match these filters in the selected area or nearby.
                        Try a broader location or fewer filters, or use the official directories.
                        Insurance acceptance and services must be confirmed with the clinic.
                      </p>
                      <button className="text-button" onClick={reset}>
                        Reset filters
                      </button>
                    </div>
                  )}
                  {providers.length > 0 && !matches.length && directorySources.map((s) => (
                    <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-button">
                      {s.name} — official directory <ArrowUpRight size={14} />
                    </a>
                  ))}
                  {providers.length === 0 && (
                    <>
                      <div className="directory-notice">
                        <span className="notice-dot" />
                        <p>
                          Our provider directory is being prepared. These links open official
                          directories; they are not verified clinic listings or filtered matches.
                        </p>
                      </div>
                      {directorySources.map((s, i) => (
                        <article className="directory-card" key={s.id}>
                          <div className="directory-card-head">
                            <span className={`directory-icon tone-${i}`}>
                              <i>{i === 2 ? <Heart size={20} /> : <Flower2 size={22} />}</i>
                            </span>
                            <span className="source-tag">OFFICIAL SOURCE</span>
                            <ArrowUpRight size={16} />
                          </div>
                          <span className="directory-region">{s.region}</span>
                          <h3>{s.name}</h3>
                          <p>{s.description}</p>
                          <a href={s.url} target="_blank" rel="noreferrer">
                            Open official directory
                            <ArrowUpRight size={14} />
                          </a>
                        </article>
                      ))}
                    </>
                  )}
                </div>
                <div className="results-footer">
                  <ShieldCheck size={14} />
                  <p>
                    No invented ratings, prices, or availability.
                    <br />
                    Always confirm details with your clinic.
                  </p>
                </div>
              </section>
              <section
                className={`map-panel ${!mobileMap ? 'mobile-hidden' : ''}`}
                aria-label="Care map"
              >
                <CareMap providers={matches} selected={selected} onSelect={onSelect} />
              </section>
            </div>
            <button className="mobile-view-toggle" onClick={() => setMobileMap(!mobileMap)}>
              {mobileMap ? <List size={16} /> : <Map size={16} />}Show {mobileMap ? 'list' : 'map'}
            </button>
            <section className="below-discovery">
              <div className="support-card">
                <span className="support-flower">
                  <Flower2 size={29} />
                </span>
                <div>
                  <span className="eyebrow">YOUR NEXT STEP STARTS HERE</span>
                  <h2>Not sure where to begin?</h2>
                  <p>Let Ellie help you find a little clarity.</p>
                </div>
                <button className="secondary-button" onClick={() => navigate('ask')}>
                  Ask Ellie
                  <MessageCircle size={15} />
                </button>
              </div>
              <div className="trust-strip">
                <span>
                  <Check size={14} />
                  Original-source information
                </span>
                <span>
                  <Heart size={14} />
                  Built around you
                </span>
                <span>
                  <ShieldCheck size={14} />
                  Your pace. Your choices.
                </span>
              </div>
            </section>
          </>
        )}
        {tab === 'care' && (
          <MyCare
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
      {appointment && (
        <AppointmentDialog
          initial={appointment}
          onClose={() => setAppointment(null)}
          onSave={(a) => {
            local.saveAppointment(a);
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
