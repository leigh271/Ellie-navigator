'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import { kinds, type Provider } from './types';
import { fitProviderBounds, MAP_STYLE, OSM_STYLE, REGION_CENTER } from './map';
type Engine = { map: LibreMap; lib: typeof import('maplibre-gl'); attempt: number };
type Session = {
  attempt: number;
  tiles: 'openfreemap' | 'osm';
  phase: 'loading' | 'ready' | 'unavailable';
  notice: string;
};
export function useCareMap(
  providers: Provider[],
  selected: string | null,
  onSelect: (id: string) => void,
  searchOrigin?: [number, number],
) {
  const container = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, Marker>());
  const selectRef = useRef(onSelect);
  const providersRef = useRef(providers);
  const originRef = useRef(searchOrigin);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [session, setSession] = useState<Session>({
    attempt: 0,
    tiles: 'openfreemap',
    phase: 'loading',
    notice: '',
  });
  const attempt = session.attempt;
  const tiles = session.tiles;
  useEffect(() => {
    selectRef.current = onSelect;
    providersRef.current = providers;
    originRef.current = searchOrigin;
  }, [onSelect, providers, searchOrigin]);
  useEffect(() => {
    let disposed = false;
    let instance: LibreMap | undefined;
    let observer: ResizeObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tileTimer: ReturnType<typeof setTimeout> | undefined;
    let styleReady = false;
    let resourceError = false;
    let fitted = false;
    // Capture this session's collection; cleanup must not remove a newer map's markers.
    const collection = markers.current;
    function report(phase: Session['phase'], notice = '') {
      if (!disposed) setSession((s) => (s.attempt === attempt ? { ...s, phase, notice } : s));
    }
    import('maplibre-gl')
      .then(({ default: lib }) => {
        if (disposed || !container.current) return;
        try {
          instance = new lib.Map({
            container: container.current,
            style: tiles === 'osm' ? OSM_STYLE : MAP_STYLE,
            center: REGION_CENTER,
            zoom: 8.6,
            attributionControl: { compact: true },
            cooperativeGestures: true,
          });
          const map = instance;
          observer = new ResizeObserver(() => {
            map.resize();
            if (styleReady && !fitted)
              fitted = fitProviderBounds(map, providersRef.current, false, originRef.current);
          });
          observer.observe(container.current);
          map.on('style.load', () => {
            if (disposed) return;
            styleReady = true;
            clearTimeout(timer);
            // A loaded style can render while tiles/glyphs are still loading. Waiting for
            // MapLibre's `load` event here previously kept a usable map at opacity: 0.
            report('ready', 'Loading geographic tiles…');
            tileTimer = setTimeout(() => {
              if (!resourceError)
                report(
                  'ready',
                  'Some map tiles are taking longer than expected. Available geography remains interactive.',
                );
            }, 15000);
            setEngine({ map, lib, attempt });
            map.resize();
            fitted = fitProviderBounds(map, providersRef.current, false, originRef.current);
          });
          map.on('load', () => {
            clearTimeout(tileTimer);
            if (!resourceError) report('ready');
          });
          map.on('error', () => {
            clearTimeout(tileTimer);
            resourceError = true;
            report(
              styleReady ? 'ready' : 'unavailable',
              styleReady
                ? 'Some map tiles or labels could not load. Available geography remains interactive.'
                : 'The map style could not load. Check your connection or tile access, then retry.',
            );
          });
          map.on('webglcontextlost', () =>
            report('unavailable', 'Map graphics were interrupted. Retry the map to restore them.'),
          );
          map.on('webglcontextrestored', () => {
            if (styleReady) {
              map.resize();
              report('ready', 'Map graphics restored. Reload if tiles are missing.');
            }
          });
          timer = setTimeout(() => {
            if (!styleReady)
              report(
                'unavailable',
                'The map style is taking too long to load. Retry when your connection is available.',
              );
          }, 15000);
        } catch {
          report(
            'unavailable',
            'Interactive maps need WebGL graphics support. Try another supported browser or retry.',
          );
        }
      })
      .catch(() =>
        report('unavailable', 'The map software could not load. Reload the page or retry.'),
      );
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(tileTimer);
      observer?.disconnect();
      collection.forEach((marker) => marker.remove());
      collection.clear();
      instance?.remove();
    };
  }, [attempt, tiles]);
  useEffect(() => {
    if (!engine || engine.attempt !== attempt) return;
    const { lib, map } = engine;
    const ids = new Set(providers.map((p) => p.id));
    markers.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });
    for (const p of providers) {
      let marker = markers.current.get(p.id);
      if (!marker) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'heart-marker';
        button.setAttribute('aria-label', `Select ${p.name}`);
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML =
          '<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true"><path fill="currentColor" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
        button.addEventListener('click', () => selectRef.current(p.id));
        marker = new lib.Marker({ element: button }).setLngLat(p.coordinates).addTo(map);
        markers.current.set(p.id, marker);
      }
      marker.setLngLat(p.coordinates);
      marker.getElement().style.setProperty('--marker-color', kinds[p.kind].color);
      marker.getElement().setAttribute('aria-label', `Select ${p.name}`);
    }
    fitProviderBounds(map, providers, false, searchOrigin);
  }, [engine, attempt, providers, searchOrigin]);
  useEffect(() => {
    if (!engine || engine.attempt !== attempt) return;
    markers.current.forEach((marker, id) => {
      marker.getElement().classList.toggle('selected', id === selected);
      marker.getElement().setAttribute('aria-pressed', String(id === selected));
    });
    const active = providers.find((p) => p.id === selected);
    if (active)
      engine.map.easeTo({
        center: active.coordinates,
        zoom: 12,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450,
      });
  }, [engine, attempt, selected, providers]);
  const activeMap = engine?.attempt === attempt && session.phase === 'ready' ? engine.map : null;
  return {
    container,
    ready: session.phase === 'ready',
    unavailable: session.phase === 'unavailable',
    notice: session.notice,
    zoomIn: () => activeMap?.zoomIn(),
    zoomOut: () => activeMap?.zoomOut(),
    reset: () =>
      activeMap?.easeTo({ center: searchOrigin ?? REGION_CENTER, zoom: searchOrigin ? 10 : 8.6 }),
    fit: () => {
      if (activeMap) fitProviderBounds(activeMap, providers, true, searchOrigin);
    },
    tiles,
    alternate: () =>
      setSession((s) => ({
        attempt: s.attempt + 1,
        tiles: s.tiles === 'osm' ? 'openfreemap' : 'osm',
        phase: 'loading',
        notice: '',
      })),
    retry: () =>
      setSession((s) => ({ attempt: s.attempt + 1, tiles: s.tiles, phase: 'loading', notice: '' })),
  };
}
