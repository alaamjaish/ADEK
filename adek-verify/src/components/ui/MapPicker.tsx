'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number | null;
  lng: number | null;
  address: string;
  lang: 'ar' | 'en';
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

// Abu Dhabi center as default
const DEFAULT_CENTER: [number, number] = [24.4539, 54.3773];
const DEFAULT_ZOOM = 11;

export default function MapPicker({ lat, lng, address, lang, onLocationChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: lat && lng ? [lat, lng] : DEFAULT_CENTER,
      zoom: lat && lng ? 15 : DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon to avoid default icon issues with bundlers
    const pinIcon = L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#1B3A5C"/>
          <circle cx="16" cy="16" r="7" fill="white"/>
        </svg>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        markerRef.current = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(map);
      }

      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&accept-language=${lang === 'ar' ? 'ar' : 'en'}`
        );
        const data = await res.json();
        const addr = data.display_name || `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`;
        onLocationChange(clickLat, clickLng, addr);
      } catch {
        onLocationChange(clickLat, clickLng, `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`);
      } finally {
        setLoading(false);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-adek-text">
        {lang === 'ar' ? 'العنوان — انقر على الخريطة لتحديد الموقع' : 'Address — Click on map to pin location'}
      </label>
      <div
        ref={mapRef}
        className="w-full h-[240px] rounded-lg border border-adek-border overflow-hidden"
        style={{ zIndex: 0 }}
      />
      {address && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-adek-border">
          <svg className="w-4 h-4 mt-0.5 text-adek-navy shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-adek-text leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {loading ? (lang === 'ar' ? 'جاري تحديد العنوان...' : 'Resolving address...') : address}
          </p>
        </div>
      )}
      {!address && (
        <p className="text-xs text-adek-text-secondary italic">
          {lang === 'ar' ? 'انقر على الخريطة لتحديد موقع السكن' : 'Click on the map to pin the residential location'}
        </p>
      )}
    </div>
  );
}
