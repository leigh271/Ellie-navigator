'use client';
import { Heart, MapPin, ArrowUpRight, Check, Phone, CalendarPlus } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { kinds } from '@/lib/types';
import { directionsURL } from '@/lib/map';
export default function ProviderCard({
  provider: p,
  selected,
  saved,
  onSelect,
  onSave,
  onAppointment,
}: {
  provider: Provider;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onSave: () => void;
  onAppointment: () => void;
}) {
  return (
    <article id={`provider-${p.id}`} className={`provider-card ${selected ? 'active' : ''}`}>
      <div className="card-top">
        <span className="category" style={{ color: kinds[p.kind].color }}>
          <Heart size={12} fill="currentColor" />
          {kinds[p.kind].label}
        </span>
        <button
          className={`icon-button ${saved ? 'saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${p.name}`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <button className="provider-name" onClick={onSelect}>
        {p.name}
      </button>
      <p className="address">
        <MapPin size={13} />
        {p.address}, {p.city}
      </p>
      <div className="service-tags">
        {p.services.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <p className="small-muted">
        {p.affordability === 'sliding-scale'
          ? 'Source lists a sliding fee scale. Confirm eligibility.'
          : 'Contact clinic for costs.'}{' '}
        Confirm insurance and appointment availability directly.
      </p>
      <div className="provider-actions">
        <a href={p.website} target="_blank" rel="noreferrer">
          Clinic website <ArrowUpRight size={14} />
        </a>
        <a
          href={directionsURL(p)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Directions to ${p.name}`}
        >
          Directions <MapPin size={13} />
        </a>
        {p.phone && (
          <a href={`tel:${p.phone.replace(/[^+\d]/g, '')}`} aria-label={`Call ${p.name}`}>
            <Phone size={14} />
          </a>
        )}
        <button onClick={onAppointment} aria-label={`Save personal appointment for ${p.name}`}>
          <CalendarPlus size={17} />
        </button>
      </div>
      <details className="source-details">
        <summary>
          <Check size={12} /> Source reviewed · details
        </summary>
        {p.sources.map((s) => (
          <p key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} ↗
            </a>
            <br />
            Checked {s.checkedAt} · {s.fields.join(', ')}
          </p>
        ))}
      </details>
    </article>
  );
}
