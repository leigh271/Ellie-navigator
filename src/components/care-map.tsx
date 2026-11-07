'use client';
import { Heart, LocateFixed, Minus, Plus, Layers, ExternalLink, Scan } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { kinds } from '@/lib/types';
import { useCareMap } from '@/lib/use-care-map';
export default function CareMap({
  providers,
  selected,
  onSelect,
}: {
  providers: Provider[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { container, ready, unavailable, notice, zoomIn, zoomOut, reset, fit, retry } = useCareMap(
    providers,
    selected,
    onSelect,
  );
  return (
    <div
      className="map-shell"
      aria-label="South Florida provider map"
      data-map-state={ready ? 'ready' : unavailable ? 'unavailable' : 'loading'}
    >
      <div className="regional-map" aria-hidden="true" hidden={ready}>
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
        <button aria-label="Zoom in" disabled={!ready} onClick={zoomIn}>
          <Plus size={18} />
        </button>
        <button aria-label="Zoom out" disabled={!ready} onClick={zoomOut}>
          <Minus size={18} />
        </button>
        <button aria-label="Reset South Florida map" disabled={!ready} onClick={reset}>
          <LocateFixed size={18} />
        </button>
        <button aria-label="Fit map to matching providers" disabled={!ready} onClick={fit}>
          <Scan size={18} />
        </button>
      </div>
      {(!ready || notice) && (
        <div className="map-status" role="status">
          <Layers size={15} />
          <span>
            {unavailable
              ? `${notice} Regional illustration, not to scale.`
              : notice || 'Regional illustration · loading interactive map…'}
          </span>
          {(unavailable || notice) && <button onClick={retry}>Reload map</button>}
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
