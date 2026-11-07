'use client';
import { useEffect, useRef, useState } from 'react';
import { Heart, LocateFixed, Minus, Plus, Layers, ExternalLink } from 'lucide-react';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import type { Provider } from '@/lib/types';
import { kinds } from '@/lib/types';
export default function CareMap({
  providers,
  selected,
  onSelect,
}: {
  providers: Provider[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let resizeObserver: ResizeObserver | undefined;
    setTimeout(() => {
      if (!disposed) {
        setReady(false);
        setUnavailable(false);
      }
    }, 0);
    import('maplibre-gl')
      .then(({ default: maplibregl }) => {
        if (disposed || !container.current) return;
        try {
          const instance = new maplibregl.Map({
            container: container.current,
            style: 'https://tiles.openfreemap.org/styles/positron',
            center: [-80.3, 25.94],
            zoom: 8.6,
            attributionControl: { compact: true },
          });
          map.current = instance;
          resizeObserver = new ResizeObserver(() => instance.resize());
          resizeObserver.observe(container.current);
          instance.on('load', () => {
            if (!disposed) {
              setReady(true);
              setUnavailable(false);
              clearTimeout(timer);
            }
          });
          instance.on('error', () => {
            if (!disposed && !instance.isStyleLoaded()) setUnavailable(true);
          });
          timer = setTimeout(() => {
            if (!disposed && !instance.isStyleLoaded()) setUnavailable(true);
          }, 12000);
        } catch {
          setUnavailable(true);
        }
      })
      .catch(() => {
        if (!disposed) setUnavailable(true);
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      resizeObserver?.disconnect();
      markers.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [retry]);
  useEffect(() => {
    if (!ready || !map.current) return;
    let disposed = false;
    import('maplibre-gl').then(({ default: lib }) => {
      if (disposed || !map.current) return;
      markers.current.forEach((m) => m.remove());
      markers.current = providers.map((p) => {
        const button = document.createElement('button');
        button.className = `heart-marker ${selected === p.id ? 'selected' : ''}`;
        button.style.setProperty('--marker-color', kinds[p.kind].color);
        button.setAttribute('aria-label', `Select ${p.name}`);
        button.setAttribute('aria-pressed', String(selected === p.id));
        button.innerHTML =
          '<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true"><path fill="currentColor" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
        button.onclick = () => onSelect(p.id);
        return new lib.Marker({ element: button }).setLngLat(p.coordinates).addTo(map.current!);
      });
      const active = providers.find((p) => p.id === selected);
      if (active) map.current.flyTo({ center: active.coordinates, zoom: 11, essential: false });
    });
    return () => {
      disposed = true;
    };
  }, [providers, selected, onSelect, ready]);
  return (
    <div className="map-shell" aria-label="South Florida provider map">
      <div className="regional-map" aria-hidden="true">
        <svg viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="#e7e8e5" strokeWidth="1" />
            </pattern>
            <linearGradient id="ocean">
              <stop stopColor="#deedf1" />
              <stop offset="1" stopColor="#eaf3f6" />
            </linearGradient>
          </defs>
          <rect width="1000" height="900" fill="#f2f3ed" />
          <rect width="1000" height="900" fill="url(#grid)" />
          <path d="M0 0H220L200 250 250 470 200 680 220 900H0Z" fill="#e3ebdf" />
          <path
            d="M730 0 715 120 750 235 720 350 710 430 675 580 690 690 620 810 590 900H1000V0Z"
            fill="url(#ocean)"
          />
          <path
            d="M755 0 760 120 780 230 760 350 755 440 730 550 730 680 670 800 640 900"
            fill="none"
            stroke="#f9faf5"
            strokeWidth="12"
          />
          <g fill="none" stroke="#fff" strokeWidth="7">
            <path d="M100 140H718M80 260H750M120 370H720M80 490H700M100 620H680M100 750H650" />
            <path d="M300 0 320 300 350 600 380 900M470 0 470 370 500 650 480 900M600 0 610 300 580 580 540 900" />
          </g>
          <path
            d="M645 0 640 240 620 450 590 610 560 760 530 900"
            fill="none"
            stroke="#ddd7c7"
            strokeWidth="6"
          />
          <path
            d="M645 0 640 240 620 450 590 610 560 760 530 900"
            fill="none"
            stroke="#fff7e4"
            strokeWidth="3"
          />
          <path d="M80 445H705" fill="none" stroke="#cad5c9" strokeDasharray="6 8" />
          <g fontFamily="Arial,sans-serif" fontSize="16" fill="#707974" textAnchor="middle">
            <text x="600" y="195">
              Fort Lauderdale
            </text>
            <text x="550" y="343">
              Hollywood
            </text>
            <text x="526" y="485">
              Aventura
            </text>
            <text x="500" y="610">
              North Miami
            </text>
            <text x="492" y="772">
              Miami
            </text>
            <text x="770" y="760">
              Miami Beach
            </text>
          </g>
          <g fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="4" fill="#97a292">
            <text x="295" y="90">
              BROWARD COUNTY
            </text>
            <text x="270" y="540">
              MIAMI-DADE COUNTY
            </text>
            <text x="85" y="680" transform="rotate(-90 85 680)">
              EVERGLADES
            </text>
            <text x="850" y="450" fill="#96b5c4" transform="rotate(90 850 450)">
              ATLANTIC OCEAN
            </text>
          </g>
        </svg>
      </div>
      <div ref={container} className={`live-map ${ready ? 'visible' : ''}`} />
      <div className="map-location">
        <span className="live-dot" /> South Florida <span className="map-location-divider" />{' '}
        Broward & Miami-Dade
      </div>
      <div className="map-controls">
        <button aria-label="Zoom in" disabled={!ready} onClick={() => map.current?.zoomIn()}>
          <Plus size={18} />
        </button>
        <button aria-label="Zoom out" disabled={!ready} onClick={() => map.current?.zoomOut()}>
          <Minus size={18} />
        </button>
        <button
          aria-label="Reset South Florida map"
          disabled={!ready}
          onClick={() => map.current?.flyTo({ center: [-80.3, 25.94], zoom: 8.6 })}
        >
          <LocateFixed size={18} />
        </button>
      </div>
      {!ready && (
        <div className="map-status">
          <Layers size={15} />
          <span>
            {unavailable
              ? 'Interactive map unavailable · regional illustration, not to scale'
              : 'Regional illustration · loading interactive map…'}
          </span>
          {unavailable && <button onClick={() => setRetry((x) => x + 1)}>Retry map</button>}
        </div>
      )}
      {providers.length === 0 && (
        <div className="map-note">
          <span className="map-note-icon">
            <Heart size={19} />
          </span>
          <div>
            <strong>A little closer to the care you need.</strong>
            <p>
              Explore South Florida’s official care directories while we prepare source-reviewed map
              listings.
            </p>
          </div>
        </div>
      )}
      <div className="map-legend">
        {Object.entries(kinds).map(([key, k]) => (
          <span key={key}>
            <Heart size={13} fill={k.color} color={k.color} />
            {k.label}
          </span>
        ))}
      </div>
      {ready && (
        <a className="map-credit" href="https://openfreemap.org/" target="_blank" rel="noreferrer">
          OpenFreeMap <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
