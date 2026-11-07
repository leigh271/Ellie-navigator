'use client';
import Link from 'next/link';
import { useState } from 'react';
import { providers } from '@/lib/providers';
import { services } from '@/lib/types';
import { insuranceCarriers } from '@/lib/provider-evidence';
export default function ClinicPartnerDemo() {
  const [step, setStep] = useState('claim');
  const [clinic, setClinic] = useState(providers[0].id);
  const [claim, setClaim] = useState(false);
  const [staged, setStaged] = useState<{
    services: string[];
    carrier: string;
    network: string;
    scope: string;
    source: string;
    booking: string;
    affordability: string;
  } | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [requests, setRequests] = useState(0);
  const p = providers.find((item) => item.id === clinic)!;
  return (
    <main className="partner-demo">
      <Link className="wordmark" href="/">
        Ellie
      </Link>
      <h1>Clinic partner preview</h1>
      <div className="demo-panel" role="note">
        <strong>Local prototype · no live accounts or authorization</strong>
        <p>
          Explore the proposed clinic workflow using sample information only. This page does not
          create accounts, verify affiliation, publish directory changes, offer real availability or
          send appointment requests. State resets when you leave or reload.
        </p>
        <p>
          Patient access and basic clinic inclusion remain free. No subscriptions or payments are
          enabled.
        </p>
      </div>
      <nav aria-label="Partner preview sections">
        {['claim', 'listing', 'slots', 'requests', 'analytics'].map((section) => (
          <button
            className="filter-chip"
            key={section}
            aria-pressed={step === section}
            onClick={() => setStep(section)}
          >
            {
              (
                {
                  claim: 'Signup & claim',
                  listing: 'Manage listing',
                  slots: 'Demo slots',
                  requests: 'Demo requests',
                  analytics: 'Demo analytics',
                } as Record<string, string>
              )[section]
            }
          </button>
        ))}
      </nav>
      <label>
        Directory location for preview
        <select
          value={clinic}
          onChange={(e) => {
            setClinic(e.target.value);
            setClaim(false);
            setStaged(null);
            setSlots([]);
            setRequests(0);
          }}
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} · {provider.county}
            </option>
          ))}
        </select>
      </label>
      {step === 'claim' && (
        <section>
          <h2>Preview signup and affiliation review</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setClaim(true);
            }}
          >
            <label>
              Sample work email
              <input type="email" placeholder="demo@example.org" required maxLength={120} />
            </label>
            <label>
              Sample role
              <input placeholder="Demo clinic manager" required maxLength={100} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" required />I am using fictional details for this prototype.
            </label>
            <button className="primary-button">Simulate listing claim</button>
          </form>
          {claim && (
            <p role="status">
              Demo claim pending review. No account was created or affiliation verified. A live
              claim would require independent clinic contact verification and authorized reviewer
              approval.
            </p>
          )}
        </section>
      )}
      {step === 'listing' && (
        <section>
          <h2>Stage a sample listing update</h2>
          <p>
            Updates below remain in this preview. Official evidence and authorization are required
            before publication.
          </p>
          <form
            key={clinic}
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const text = (name: string) => String(form.get(name) || '');
              setStaged({
                services: form.getAll('services').map(String),
                carrier: text('carrier'),
                network: text('network'),
                scope: text('scope'),
                source: text('source'),
                booking: text('booking'),
                affordability: text('affordability'),
              });
            }}
          >
            <p>
              {p.name}
              <br />
              {p.address}, {p.city}
            </p>
            <fieldset>
              <legend>Sample services · not published</legend>
              {services.map((service) => (
                <label className="checkbox-label" key={service}>
                  <input
                    type="checkbox"
                    name="services"
                    value={service}
                    defaultChecked={(staged?.services || p.services).includes(service)}
                  />
                  {service}
                </label>
              ))}
            </fieldset>
            <label>
              Sample insurance participation
              <select name="carrier" defaultValue={staged?.carrier || ''}>
                <option value="">Select a carrier</option>
                {insuranceCarriers.map((carrier) => (
                  <option key={carrier}>{carrier}</option>
                ))}
              </select>
            </label>
            <label>
              Sample exact network
              <input
                name="network"
                defaultValue={staged?.network || ''}
                placeholder="Fictional demo network"
                maxLength={100}
              />
            </label>
            <label>
              Participation scope
              <select name="scope" defaultValue={staged?.scope || 'Organization listing only'}>
                <option>Organization listing only</option>
                <option>Location</option>
                <option>Specific provider and network</option>
              </select>
            </label>
            <label>
              Sample source URL
              <input
                name="source"
                defaultValue={staged?.source || ''}
                type="url"
                placeholder="https://example.org/source"
                maxLength={300}
              />
            </label>
            <label>
              Sample booking URL
              <input
                name="booking"
                defaultValue={staged?.booking || ''}
                type="url"
                placeholder="https://example.org/appointments"
                maxLength={300}
              />
            </label>
            <label>
              Sample affordability note
              <textarea
                name="affordability"
                defaultValue={staged?.affordability || ''}
                placeholder="Demo eligibility policy; not a real clinic claim"
                maxLength={500}
              />
            </label>
            <button className="primary-button">Stage demo update</button>
          </form>
          {staged && (
            <div className="demo-panel" aria-label="Staged sample listing">
              <p role="status">
                Demo update staged in this page only. The public listing has not changed.
              </p>
              <p>Sample services: {staged.services.join(', ') || 'None selected'}.</p>
              <p>
                Sample participation: {staged.carrier || 'None'} {staged.network} · {staged.scope}.
              </p>
              <p>Sample source: {staged.source || 'Not supplied'}.</p>
              <p>Sample booking link: {staged.booking || 'Not supplied'}.</p>
              <p>Sample affordability: {staged.affordability || 'Not supplied'}.</p>
            </div>
          )}
        </section>
      )}
      {step === 'slots' && (
        <section>
          <h2>Fictional appointment slots</h2>
          <p>
            No clinic calendar is connected. Live slots require approved scheduling access or an
            authorized clinic-managed calendar.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setSlots((previous) => [
                ...previous,
                `${form.get('date')} at ${form.get('time')} · synthetic`,
              ]);
            }}
          >
            <label>
              Demo date
              <input name="date" type="date" required min="2026-01-01" max="2100-12-31" />
            </label>
            <label>
              Demo time
              <input name="time" type="time" required />
            </label>
            <button className="primary-button">Add synthetic slot</button>
          </form>
          <ul>
            {slots.map((slot, i) => (
              <li key={i}>
                {slot}{' '}
                <button
                  className="text-button"
                  onClick={() => setSlots((previous) => previous.filter((_, index) => index !== i))}
                >
                  Remove demo slot {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {step === 'requests' && (
        <section>
          <h2>Synthetic appointment requests</h2>
          <p>No patient data or clinic requests are connected.</p>
          <button className="secondary-button" onClick={() => setRequests((count) => count + 1)}>
            Generate fictional request
          </button>
          <ul>
            {Array.from({ length: requests }, (_, i) => (
              <li key={i}>
                Demo request {i + 1} · fictional patient · review pending · not sent to clinic
              </li>
            ))}
          </ul>
        </section>
      )}
      {step === 'analytics' && (
        <section>
          <h2>Preview session activity</h2>
          <p>These counts describe this local demonstration, not clinic performance.</p>
          <div className="verification-grid">
            <div>
              <strong>Demo claims</strong>
              <span>{claim ? 1 : 0}</span>
            </div>
            <div>
              <strong>Staged demo updates</strong>
              <span>{staged ? 1 : 0}</span>
            </div>
            <div>
              <strong>Synthetic slots</strong>
              <span>{slots.length}</span>
            </div>
            <div>
              <strong>Fictional requests</strong>
              <span>{requests}</span>
            </div>
          </div>
        </section>
      )}
      <div className="demo-panel">
        <h2>Requirements for live partner access</h2>
        <p>
          Server-backed authentication, independently reviewed affiliation, per-clinic
          authorization, audited source review, durable storage and an approved scheduling
          integration are required before enabling real clinic changes or patient requests.
        </p>
      </div>
      <Link href="/">Return to patient Find Care</Link>
    </main>
  );
}
