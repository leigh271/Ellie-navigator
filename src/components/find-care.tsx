'use client';
import { useMemo, useState, useRef } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Flower2,
  Heart,
  List,
  Map,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Provider, Service } from '@/lib/types';
import { insuranceCarriers, verifiedPlans, verifiedParticipation } from '@/lib/provider-evidence';
import { services } from '@/lib/types';
import { providers, searchCareProviders, insuranceQueryFor, type Filters } from '@/lib/providers';
import directorySources from '@/data/directory-sources.json';
import CareMap from './care-map';
import ProviderCard from './provider-card';
const carrierOptions = [
  ...new Set([
    ...insuranceCarriers,
    ...providers.flatMap((p) => [
      ...verifiedPlans(p),
      ...verifiedParticipation(p).map((entry) => entry.carrier),
    ]),
  ]),
];
const empty: Filters = { location: '', service: '', insurance: '', affordability: '' };
export default function FindCare({
  selected,
  onSelect,
  favorites,
  onFavorite,
  onAppointment,
  onDetails,
  onAsk,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  favorites: string[];
  onFavorite: (id: string) => void;
  onAppointment: (p: Provider) => void;
  onDetails: (id: string) => void;
  onAsk: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(empty);
  const [applied, setApplied] = useState<Filters>(empty);
  const [more, setMore] = useState(false);
  const [view, setView] = useState<'combined' | 'map' | 'list'>('combined');
  const [mobileMap, setMobileMap] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [appliedSaved, setAppliedSaved] = useState(false);
  const [radius, setRadius] = useState(50);
  const [appliedRadius, setAppliedRadius] = useState(50);
  const resultRef = useRef<HTMLElement>(null);
  const search = useMemo(
    () => searchCareProviders(providers, applied, appliedRadius),
    [applied, appliedRadius],
  );
  const items = useMemo(
    () => search.items.filter((hit) => !appliedSaved || favorites.includes(hit.provider.id)),
    [search, appliedSaved, favorites],
  );
  const matches = useMemo(() => items.map((hit) => hit.provider), [items]);
  const pending =
    JSON.stringify(draft) !== JSON.stringify(applied) ||
    savedOnly !== appliedSaved ||
    radius !== appliedRadius;
  function change(key: keyof Filters, value: string) {
    setDraft((d) => ({
      ...d,
      [key]: value,
      ...(key === 'insurance' && value ? { payment: '' } : {}),
    }));
  }
  function apply(overrides: Partial<Filters> = {}) {
    const next = { ...draft, ...overrides };
    setDraft(next);
    setApplied(next);
    setAppliedSaved(savedOnly);
    setAppliedRadius(radius);
    onSelect(null);
  }
  function reset() {
    setDraft(empty);
    setApplied(empty);
    setSavedOnly(false);
    setAppliedSaved(false);
    setRadius(50);
    setAppliedRadius(50);
    onSelect(null);
  }
  function select(id: string) {
    onSelect(id);
    setMobileMap(false);
    requestAnimationFrame(() =>
      document
        .getElementById(`provider-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    );
  }
  const hasFilters = Boolean(
    applied.location ||
    applied.service ||
    applied.insurance ||
    applied.affordability ||
    appliedSaved ||
    applied.carrier ||
    applied.county ||
    applied.category ||
    applied.payment,
  );
  const firstUnknown = items.findIndex((hit) => hit.insurance === 'unknown');
  return (
    <>
      <section className="search-section" aria-label="Filter care providers">
        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          <label className="location-field">
            <MapPin size={18} />
            <span>
              <span className="field-label">WHERE ARE YOU LOOKING?</span>
              <input
                aria-label="Location"
                placeholder="City, ZIP, county, or clinic"
                maxLength={120}
                value={draft.location}
                onChange={(e) => change('location', e.target.value)}
              />
            </span>
          </label>
          <label className="service-field">
            <Heart size={18} />
            <span>
              <span className="field-label">WHAT BRINGS YOU HERE?</span>
              <select
                aria-label="Healthcare service"
                value={draft.service}
                onChange={(e) => change('service', e.target.value)}
              >
                <option value="">All care / general directory</option>
                <optgroup label="Cervical cancer screening">
                  {services.slice(0, 3).map((s) => (
                    <option key={s} value={s}>
                      {s === 'Pap test' ? 'Pap smear / Pap test' : s}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Preventive and gynecology care">
                  {services.slice(3).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </optgroup>
              </select>
            </span>
            <ChevronDown size={14} />
          </label>
          <label className="insurance-field">
            <ShieldCheck size={18} />
            <span>
              <span className="field-label">INSURANCE · OPTIONAL</span>
              <input
                aria-label="Insurance plan"
                maxLength={100}
                placeholder="All insurance / Not specified"
                aria-describedby="insurance-help"
                value={draft.insurance}
                onChange={(e) => change('insurance', e.target.value)}
              />
            </span>
          </label>
          <button type="submit" aria-label="Find Care" className="primary-button search-button">
            <Search size={17} />
            <span>Find Care</span>
          </button>
        </form>
        <div className="manual-filter-bar">
          <label>
            County
            <select
              aria-label="County"
              value={draft.county || ''}
              onChange={(e) => change('county', e.target.value)}
            >
              <option value="">All South Florida</option>
              <option>Broward</option>
              <option>Miami-Dade</option>
            </select>
          </label>
          <label>
            Insurance carrier
            <select
              aria-label="Insurance carrier"
              value={draft.payment ? 'self-pay' : draft.carrier || ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  carrier: e.target.value === 'self-pay' ? '' : e.target.value,
                  insurance: '',
                  payment: e.target.value === 'self-pay' ? 'self-pay' : '',
                }))
              }
            >
              <option value="">Any / enter exact plan</option>
              {carrierOptions.map((carrier) => (
                <option key={carrier}>{carrier}</option>
              ))}
              <option value="self-pay">Uninsured / Self-Pay</option>
            </select>
          </label>
          <label>
            Search radius
            <select
              aria-label="Search radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  Up to {n} miles
                </option>
              ))}
            </select>
          </label>
        </div>
        <p id="insurance-help" className="insurance-help">
          Insurance is optional. Enter a company and plan name, not your member ID or policy number.
          Unknown acceptance stays labeled unknown; confirm exact coverage with the clinic.
        </p>
        <div className="filter-row">
          <div className="service-chips">
            <button
              className={`filter-chip ${!draft.service ? 'selected' : ''}`}
              onClick={() => apply({ service: '' })}
            >
              All care
            </button>
            {(
              [
                'Cervical cancer screening',
                'HPV vaccination',
                'Annual gynecology / wellness',
                'Birth control / family planning',
              ] as Service[]
            ).map((s) => (
              <button
                key={s}
                className={`filter-chip ${draft.service === s ? 'selected' : ''}`}
                onClick={() => apply({ service: s })}
              >
                {s === 'Annual gynecology / wellness'
                  ? 'Annual wellness'
                  : s === 'Birth control / family planning'
                    ? 'Family planning'
                    : s}
              </button>
            ))}
          </div>
          <button
            className={`filter-chip more-filters ${more ? 'selected' : ''}`}
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>
        {pending && (
          <p className="pending-search" role="status">
            Search fields changed. Select Find Care to apply them.
          </p>
        )}
        {more && (
          <div className="expanded-filters">
            <label className="mobile-insurance">
              Insurance · optional
              <input
                aria-label="Insurance plan on mobile"
                maxLength={100}
                placeholder="All insurance / Not specified"
                aria-describedby="insurance-help"
                value={draft.insurance}
                onChange={(e) => change('insurance', e.target.value)}
              />
            </label>
            <label>
              Clinic category
              <select
                aria-label="Clinic category"
                value={draft.category || ''}
                onChange={(e) => change('category', e.target.value)}
              >
                <option value="">All supported categories</option>
                {[
                  'Cervical Cancer Screening / Pap Smears',
                  'HPV Testing',
                  'Gynecology / OB-GYN',
                  'Family Planning / Reproductive Health',
                  'STI / Sexual Health Testing',
                  'Breast Health / Mammography',
                  'Primary Care / Women’s Preventive Health',
                  'Community Health Centers',
                  'Low-Cost / Sliding-Scale Clinics',
                  'Women’s Health Specialty Care',
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Affordability
              <select
                aria-label="Affordability"
                value={draft.affordability}
                onChange={(e) => change('affordability', e.target.value)}
              >
                <option value="">All cost options</option>
                <option value="sliding-scale">Documented sliding fee scale</option>
              </select>
            </label>
            <label>
              Maximum nearby radius
              <select
                aria-label="Maximum nearby radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} miles
                  </option>
                ))}
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
              Service filters require source evidence. Plan uncertainty is shown separately, never
              treated as acceptance.
            </p>
          </div>
        )}
      </section>
      <div className="discovery-view-controls" role="group" aria-label="Directory view">
        {(['combined', 'map', 'list'] as const).map((mode) => (
          <button
            key={mode}
            className="filter-chip"
            aria-pressed={view === mode}
            onClick={() => setView(mode)}
          >
            {mode === 'combined' ? 'Map + list' : mode === 'map' ? 'Map view' : 'List view'}
          </button>
        ))}
      </div>
      <div className="mobile-discovery-toolbar">
        <span>{matches.length} clinics shown</span>
        {view === 'combined' && (
          <button className="mobile-view-toggle" onClick={() => setMobileMap((v) => !v)}>
            {mobileMap ? <List size={16} /> : <Map size={16} />}Show {mobileMap ? 'list' : 'map'}
          </button>
        )}
      </div>
      <div className={`discovery-layout view-${view}`}>
        <section
          ref={resultRef}
          id="care-results"
          className={`results-panel ${mobileMap && view === 'combined' ? 'mobile-hidden' : ''} ${view === 'map' ? 'view-hidden' : ''}`}
          aria-label="Care results"
        >
          <div className="results-heading">
            <div>
              <h2>{applied.service ? 'Service-verified matches' : 'HRSA clinic directory'}</h2>
              <p role="status" aria-label="Result count">
                {matches.length}{' '}
                {applied.service ? 'service-verified matches' : 'location-sourced clinics'}
              </p>
            </div>
            <span className="results-count">{matches.length}</span>
          </div>
          <div className="directory-notice live-directory-notice">
            <ShieldCheck size={14} />
            <p>
              Locations are sourced from your supplied HRSA extract. Women’s services, insurance and
              fees are unconfirmed unless a card says otherwise.
            </p>
          </div>
          {hasFilters && (
            <div className="active-filter-row">
              <span>{applied.service || applied.location || 'Filtered care'}</span>
              <button className="text-button" onClick={reset}>
                Clear filters
                <X size={12} />
              </button>
            </div>
          )}
          <div className="provider-scroll">
            {search.nearby.length > 0 && (
              <p className="search-explanation">
                Nearby alternatives included within {search.radiusUsed} miles. {search.originLabel}
              </p>
            )}
            {search.declinedCount > 0 && (
              <p className="search-explanation">
                {search.declinedCount} clinics with source-documented nonacceptance of the entered
                plan are excluded.
              </p>
            )}
            {applied.payment && items.length > 0 && (
              <p className="search-explanation">
                Self-pay preference: documented options are prioritized after proximity. Unknown
                payment and sliding-scale eligibility must be checked with the clinic.
              </p>
            )}
            {items.map((hit, index) => (
              <div key={hit.provider.id}>
                {insuranceQueryFor(applied) && index === firstUnknown && (
                  <h3 className="insurance-section-heading">
                    Insurance acceptance unknown · contact clinic
                  </h3>
                )}
                <ProviderCard
                  provider={hit.provider}
                  selected={selected === hit.provider.id}
                  saved={favorites.includes(hit.provider.id)}
                  onSelect={() => select(hit.provider.id)}
                  onSave={() => onFavorite(hit.provider.id)}
                  onAppointment={() => onAppointment(hit.provider)}
                  onDetails={() => {
                    onSelect(hit.provider.id);
                    onDetails(hit.provider.id);
                  }}
                  insuranceQuery={insuranceQueryFor(applied)}
                  nearby={hit.nearby}
                  distanceMiles={hit.distanceMiles}
                />
              </div>
            ))}
            {!items.length && (
              <div className="empty-care search-empty">
                <Search size={25} />
                <h3>
                  {applied.service
                    ? 'No service-verified matches yet.'
                    : /^\d/.test(applied.location) &&
                        !search.locationMatchCount &&
                        !search.anchorFound
                      ? 'ZIP code not found in this directory.'
                      : 'No clinics match these filters.'}
                </h3>
                <p>
                  {applied.service
                    ? `We haven’t confirmed ${applied.service.toLowerCase()} at a matching clinic. Location records alone cannot establish that service.`
                    : applied.location && !search.anchorFound && !search.locationMatchCount
                      ? 'Try a city, ZIP code, county or provider name from the South Florida directory.'
                      : 'Try a broader area or fewer filters. Unknown insurance acceptance is never silently treated as acceptance.'}
                </p>
                {applied.service && (
                  <button className="secondary-button" onClick={() => apply({ service: '' })}>
                    Browse general clinics · services unconfirmed
                  </button>
                )}
                {applied.location && (
                  <button
                    className="text-button"
                    onClick={() => apply({ location: '', county: '' })}
                  >
                    Expand to Broward & Miami-Dade
                  </button>
                )}
                {insuranceQueryFor(applied) && (
                  <button
                    className="text-button"
                    onClick={() => apply({ insurance: '', carrier: '' })}
                  >
                    Remove insurance preference
                  </button>
                )}
                <button className="text-button" onClick={reset}>
                  Reset filters
                </button>
                <p className="small-muted">
                  You can choose a related service above. Ellie never substitutes a different
                  service without your choice.
                </p>
              </div>
            )}
            {!items.length && (
              <div className="official-directory-links">
                <h3>Official healthcare directories</h3>
                {directorySources.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                    {s.name} · {s.region}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="results-footer">
            <ShieldCheck size={14} />
            <p>
              Contact the clinic to confirm care, coverage and booking.
              <br />
              No invented ratings, prices or availability.
            </p>
          </div>
        </section>
        <section
          className={`map-panel ${!mobileMap && view === 'combined' ? 'mobile-hidden' : ''} ${view === 'list' ? 'view-hidden' : ''}`}
          aria-label="Care map"
        >
          <CareMap
            providers={matches}
            selected={selected}
            onSelect={select}
            searchOrigin={search.origin}
            searchLabel={applied.location}
            onDetails={onDetails}
          />
        </section>
      </div>
      <section className="below-discovery">
        <div className="support-card">
          <span className="support-flower">
            <Flower2 size={29} />
          </span>
          <div>
            <span className="eyebrow">YOUR NEXT STEP STARTS HERE</span>
            <h2>Not sure where to begin?</h2>
            <p>Let Ellie help you prepare questions for your clinic.</p>
          </div>
          <button className="secondary-button" onClick={onAsk}>
            Ask Ellie
            <MessageCircle size={15} />
          </button>
        </div>
        <div className="trust-strip">
          <span>
            <Check size={14} />
            Source-documented locations
          </span>
          <span>
            <Heart size={14} />
            Your pace. Your choices.
          </span>
          <span>
            <ShieldCheck size={14} />
            No booking claims
          </span>
        </div>
      </section>
    </>
  );
}
