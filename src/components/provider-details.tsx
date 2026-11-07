'use client';
import { useEffect, useRef } from 'react';
import { X, Heart, Phone, ArrowUpRight, MapPin, CalendarPlus } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { kinds } from '@/lib/types';
import { directionsURL, appleDirectionsURL } from '@/lib/map';
import {
  hasEvidence,
  phoneURL,
  safeWebsite,
  sourceDate,
  verifiedBookingURL,
  verifiedPlans,
  verifiedServices,
} from '@/lib/provider-evidence';
export default function ProviderDetails({
  provider: p,
  saved,
  onSave,
  onClose,
  onAppointment,
}: {
  provider: Provider;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
  onAppointment: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const offered = verifiedServices(p);
  const plans = verifiedPlans(p);
  const phone = phoneURL(p.phone);
  const web = safeWebsite(p.website);
  const booking = verifiedBookingURL(p);
  function close() {
    ref.current?.close();
    onClose();
  }
  return (
    <dialog
      ref={ref}
      className="appointment-dialog provider-dialog"
      aria-labelledby="provider-detail-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialog-content">
        <button
          className="dialog-close icon-button"
          aria-label="Close provider details"
          onClick={close}
        >
          <X size={20} />
        </button>
        <span className="category" style={{ color: kinds[p.kind].color }}>
          <Heart size={14} fill="currentColor" />
          {kinds[p.kind].label}
        </span>
        <h2 id="provider-detail-title">{p.name}</h2>
        {p.organization && <p className="provider-organization">{p.organization}</p>}
        <p className="detail-address">
          <MapPin size={16} />
          {p.address}
          <br />
          {p.city}, {p.state || 'FL'} {p.zip || ''} · {p.county} County
        </p>
        <div className="verification-grid">
          <div>
            <strong>Location</strong>
            <span>{p.hrsa ? 'Sourced from supplied HRSA extract' : 'Source reviewed'}</span>
          </div>
          <div>
            <strong>Medical services</strong>
            <span>{offered.length ? 'See confirmed services below' : 'Not verified'}</span>
          </div>
          <div>
            <strong>Insurance</strong>
            <span>{plans.length ? 'Documented plans listed below' : 'Unknown'}</span>
          </div>
          <div>
            <strong>Booking</strong>
            <span>
              {booking ? 'Official link source-reviewed' : 'No verified online booking link'}
            </span>
          </div>
        </div>
        <section>
          <h3>Healthcare services</h3>
          {offered.length ? (
            <ul>
              {offered.map((s) => (
                <li key={s}>{s} · source verified</li>
              ))}
            </ul>
          ) : (
            <p>
              No location-specific women’s healthcare services have been independently confirmed
              yet. HRSA listing does not establish Pap tests, HPV testing, gynecology or
              vaccination. Ask the clinic about the service you need.
            </p>
          )}
        </section>
        <section>
          <h3>Insurance and costs</h3>
          <p>
            {plans.length
              ? `Source-listed plans: ${plans.join(', ')}. Confirm your exact plan and service coverage with the clinic.`
              : 'Insurance plans are not established. Ask about your insurance company and exact plan; do not send a member ID through Ellie.'}
          </p>
          <p>
            {p.affordability === 'sliding-scale' && hasEvidence(p, 'affordability')
              ? 'A source documents a sliding fee scale; eligibility and costs must be confirmed.'
              : 'No location-specific fee or affordability policy has been verified. Ask the clinic about costs and payment options.'}
          </p>
        </section>
        <section>
          <h3>Contact the clinic</h3>
          {phone ? (
            <p>
              <a href={phone}>
                <Phone size={14} /> {p.phone}
              </a>{' '}
              · number supplied by source
            </p>
          ) : (
            <p>Telephone not supplied.</p>
          )}
          {web ? (
            <p>
              <a href={web} target="_blank" rel="noreferrer">
                Visit Official Website <ArrowUpRight size={13} />
              </a>{' '}
              · URL supplied by source; live availability not checked
            </p>
          ) : (
            <p>No website supplied. Use the source-provided phone number.</p>
          )}
          <p>
            Contact the clinic for eligibility, services, opening hours and appointment
            availability. Ellie does not book or confirm a clinic visit.
          </p>
        </section>
        <section>
          <h3>Sources and dates</h3>
          {p.hrsa && (
            <p>
              HRSA record date: {p.hrsa.sourceRecordDate}. Imported from the user-supplied official
              dataset extract. This is not an independent live website check.
            </p>
          )}
          <p>Last extract/source review: {sourceDate(p)}.</p>
          {p.sources.map((s) => (
            <p key={s.url + s.title}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title} ↗
              </a>
              <br />
              Supports: {s.fields.join(', ')}.
            </p>
          ))}
        </section>
        <div className="detail-directions">
          <a href={directionsURL(p)} target="_blank" rel="noreferrer">
            Google Maps directions ↗
          </a>
          <a href={appleDirectionsURL(p)} target="_blank" rel="noreferrer">
            Apple Maps directions ↗
          </a>
        </div>
        <div className="detail-actions">
          {booking ? (
            <a className="primary-button" href={booking} target="_blank" rel="noreferrer">
              Book with Clinic <ArrowUpRight size={15} />
            </a>
          ) : phone ? (
            <a className="primary-button" href={phone}>
              <Phone size={15} />
              Call Clinic
            </a>
          ) : web ? (
            <a className="primary-button" href={web} target="_blank" rel="noreferrer">
              Visit Official Website
            </a>
          ) : null}
          <button className="secondary-button" onClick={onSave}>
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved to My Care' : 'Save to My Care'}
          </button>
          <button className="secondary-button" onClick={onAppointment}>
            <CalendarPlus size={15} />
            Save personal appointment
          </button>
        </div>
        <p className="small-muted">
          After the clinic confirms your visit, enter its date and time in My Care. Saving here is a
          personal calendar record, not a booking request.
        </p>
      </div>
    </dialog>
  );
}
