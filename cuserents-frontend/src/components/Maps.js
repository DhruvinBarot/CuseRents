import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { CAMPUS } from '../places';

// shortcut: OpenStreetMap's free tile server allows light use with attribution; switch to a keyed provider (e.g. MapTiler, Stadia) before heavy traffic
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const PIN_FUZZ_M = 250; // backend shows pins within 100-250 m of the real spot

const money = (value) => { const n = parseFloat(value); return n % 1 ? n.toFixed(2) : String(n); };

const priceIcon = (item, active) => L.divIcon({
  className: 'price-pin-anchor',
  iconSize: null,
  html: `<span class="price-pin${active ? ' active' : ''}">$${money(item.price_per_hour)}</span>`,
});

const clusterIcon = (cluster) => L.divIcon({
  className: 'price-pin-anchor',
  iconSize: null,
  html: `<span class="cluster-pin">${cluster.getChildCount()}</span>`,
});

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], zoom); }, [map, center.lat, center.lng, zoom]);
  return null;
}

// Leaflet measures its box once; re-measure when the map becomes visible (mobile toggle)
function FixSize({ visible }) {
  const map = useMap();
  useEffect(() => { if (visible) setTimeout(() => map.invalidateSize(), 0); }, [map, visible]);
  return null;
}

export function MapView({ items, center, radiusKm, activeId, onSelect, onView, photoFor, visible = true }) {
  const zoom = !radiusKm ? 14 : radiusKm <= 0.4 ? 16 : 15;
  const active = items.find(i => i.id === activeId);
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="leaflet-map" scrollWheelZoom>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <Recenter center={center} zoom={zoom} />
      <FixSize visible={visible} />
      <CircleMarker center={[center.lat, center.lng]} radius={7} pathOptions={{ color: '#fff', weight: 3, fillColor: '#202121', fillOpacity: 1 }} />
      {radiusKm && (
        <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#202121', weight: 1, dashArray: '6 6', fillOpacity: 0.03 }} />
      )}
      {active && (
        <Circle center={[active.lat, active.lng]} radius={PIN_FUZZ_M} pathOptions={{ color: '#C2410C', weight: 1, fillColor: '#F76900', fillOpacity: 0.12 }} />
      )}
      <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon} showCoverageOnHover={false} maxClusterRadius={45}>
        {items.map(item => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={priceIcon(item, item.id === activeId)}
            zIndexOffset={item.id === activeId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(item.id) }}
            title={item.title}
            keyboard
          >
            <Popup closeButton={false} className="map-popup">
              <div className="popup-card">
                {photoFor(item) && <img src={photoFor(item)} alt="" />}
                <p className="popup-title">{item.title}</p>
                <p className="popup-meta">${money(item.price_per_hour)}/hr · approximate location</p>
                <button className="btn btn-dark" onClick={() => onView(item)}>View item</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

function PinMover({ onMove }) {
  useMapEvents({ click: (e) => onMove(e.latlng.lat, e.latlng.lng) });
  return null;
}

const pickerIcon = L.divIcon({ className: 'price-pin-anchor', iconSize: null, html: '<span class="drop-pin"></span>' });

// Owner picks the exact pickup spot: click the map, drag the pin, or use device location
export function LocationPicker({ lat, lng, onChange }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [focus, setFocus] = useState(null); // only "Use my location" moves the view; taps and drags don't
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
  const point = hasPin ? { lat, lng } : CAMPUS;

  const locateMe = () => {
    if (!navigator.geolocation) { setError("Your browser can't share location. Tap the map instead."); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        onChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => { setLocating(false); setError('Location is blocked. Tap the map to place the pin instead.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker">
      <div className="picker-head">
        <span>{hasPin ? 'Pin placed. Drag it or tap the map to adjust.' : 'Tap the map at your pickup spot.'}</span>
        <button type="button" className="chip" onClick={locateMe} disabled={locating}>
          <LocateFixed size={16} aria-hidden="true" /> {locating ? 'Locating...' : 'Use my location'}
        </button>
      </div>
      <MapContainer center={[point.lat, point.lng]} zoom={15} className="leaflet-map picker-map" scrollWheelZoom={false}>
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        {focus && <Recenter center={focus} zoom={17} />}
        <PinMover onMove={onChange} />
        {hasPin && (
          <Marker
            position={[lat, lng]}
            icon={pickerIcon}
            draggable
            eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange(p.lat, p.lng); } }}
          />
        )}
      </MapContainer>
      {error && <p className="picker-error" role="alert">{error}</p>}
      <p className="photo-hint">Renters see an approximate area and your street name. The exact spot is shared after you accept a booking.</p>
    </div>
  );
}
