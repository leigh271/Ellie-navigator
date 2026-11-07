'use client';
import { Heart, MapPin, ArrowUpRight, Phone, CalendarPlus, Check } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { kinds } from '@/lib/types';
import { directionsURL } from '@/lib/map';
import {
  hasEvidence,
  insuranceStatus,
  phoneURL,
  safeWebsite,
  verifiedBookingURL,
  verifiedPlans,
  verifiedServices,
} from '@/lib/provider-evidence';
export default function ProviderCard({
  provider: p,
  selected,
  saved,
  onSelect,
  onSave,
  onAppointment,
  onDetails,
  insuranceQuery = '',
  nearby = false,
  distanceMiles,
}: {
  provider: Provider;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onSave: () => void;
  onAppointment: () => void;
  onDetails?: () => void;
  insuranceQuery?: string;
  nearby?: boolean;
  distanceMiles?: number;
}) {
  const offered = verifiedServices(p);
  const coverage = insuranceStatus(p, insuranceQuery);
  const booking = verifiedBookingURL(p);
  const phone = phoneURL(p.phone);
  const website = safeWebsite(p.website);
  return (
    <article
      id={`provider-${p.id}`}
      className={`provider-card ${selected ? 'active' : ''}`}
      data-provider-id={p.id}
    >
      <div className="card-top">
        <span className="category" style={{ color: kinds[p.kind].color }}>
          <Heart size={13} fill="currentColor" />
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
      {nearby && (
        <span className="nearby-badge">
          Nearby alternative{distanceMiles != null ? ` · ~${distanceMiles.toFixed(1)} mi` : ''}
        </span>
      )}
      <button className="provider-name" onClick={onSelect}>
        {p.name}
      </button>
      <p className="address">
        <MapPin size={13} />
        {p.address}, {p.city}
        {p.zip ? ` ${p.zip}` : ''}
      </p>
      <span className="location-badge">
        <Check size={12} />
        {p.hrsa ? 'Location: HRSA record' : 'Location source reviewed'}
      </span>
      {offered.length ? (
        <div className="service-tags">
          {offered.map((s) => (
            <span key={s}>Verified: {s}</span>
          ))}
        </div>
      ) : (
        <p className="service-unknown">
          Women’s health services not yet confirmed at this location.
        </p>
      )}
      <p className={`insurance-status ${coverage === 'confirmed' ? 'confirmed' : ''}`}>
        {coverage === 'confirmed'
          ? `Documented plan match: ${verifiedPlans(p)
              .filter((plan) => plan.toLowerCase().includes(insuranceQuery.trim().toLowerCase()))
              .join(', ')}. Confirm your exact coverage.`
          : coverage === 'declined'
            ? `Source documents nonacceptance for ${insuranceQuery}.`
            : coverage === 'not-requested' && verifiedPlans(p).length
              ? `Documented plans: ${verifiedPlans(p).join(', ')}. Confirm your exact coverage.`
              : insuranceQuery
                ? `Insurance unknown for “${insuranceQuery}”. Call to confirm.`
                : 'Insurance acceptance unknown. Call to confirm your plan.'}
      </p>
      <p className="small-muted">
        {p.affordability === 'sliding-scale' && hasEvidence(p, 'affordability')
          ? 'Source lists a sliding fee scale; confirm eligibility.'
          : 'Fees and affordability not verified.'}{' '}
        Appointment availability must be confirmed with the clinic.
      </p>
      <div className="provider-actions">
        {booking ? (
          <a className="clinic-contact" href={booking} target="_blank" rel="noreferrer">
            Book with Clinic <ArrowUpRight size={14} />
          </a>
        ) : phone ? (
          <a className="clinic-contact" href={phone}>
            <Phone size={14} />
            Call Clinic
          </a>
        ) : website ? (
          <a className="clinic-contact" href={website} target="_blank" rel="noreferrer">
            Visit Official Website <ArrowUpRight size={14} />
          </a>
        ) : (
          <span className="small-muted">No contact information supplied.</span>
        )}
        {onDetails && (
          <button
            className="text-button"
            onClick={onDetails}
            aria-label={`View details for ${p.name}`}
          >
            View details
          </button>
        )}
        <a
          href={directionsURL(p)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Directions to ${p.name}`}
        >
          Directions <MapPin size={13} />
        </a>
        <button onClick={onAppointment} aria-label={`Save personal appointment for ${p.name}`}>
          <CalendarPlus size={16} />
          Save appointment
        </button>
      </div>
      <details className="source-details">
        <summary>Source and verification details</summary>
        <p>
          Location-only records are not confirmed matches for a medical service.{' '}
          {p.hrsa ? `HRSA extract record date: ${p.hrsa.sourceRecordDate}.` : ''}
        </p>
        {p.sources.map((s) => (
          <p key={s.url + s.title}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} ↗
            </a>
            <br />
            Extract/source reviewed {s.checkedAt}. Supported fields: {s.fields.join(', ')}.
          </p>
        ))}
      </details>
    </article>
  );
}
