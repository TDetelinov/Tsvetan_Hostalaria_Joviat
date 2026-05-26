import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import { loadGoogleMapsPlaces } from './googleMapsLoader';
import { useI18n } from './i18n';
import 'leaflet/dist/leaflet.css';

const DEFAULT_LOCATION = { lat: 41.7286, lng: 1.8219 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const MapUpdater = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16, { duration: 0.8 });
  }, [location, map]);

  return null;
};

const LocationMarker = ({ location, onLocationChange }) => {
  useMapEvents({
    click(event) {
      onLocationChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });

  return <Marker position={[location.lat, location.lng]} icon={icon} />;
};

const AddRestaurant = ({ onBack }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [placesState, setPlacesState] = useState('idle');
  const [placesMessage, setPlacesMessage] = useState('');
  const autocompleteInputRef = useRef(null);

  useEffect(() => {
    let autocompleteInstance = null;
    let cancelled = false;
    const prevAuthFailure = window.gm_authFailure;

    window.gm_authFailure = () => {
      if (!cancelled) {
        setPlacesState('error');
        setPlacesMessage(t('googleMapsAuthFailed'));
      }
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    const loadPlaces = async () => {
      if (!GOOGLE_MAPS_API_KEY) {
        setPlacesState('disabled');
        setPlacesMessage(t('googleMapsDisabled'));
        return;
      }

      setPlacesState('loading');
      setPlacesMessage(t('googleMapsLoading'));

      try {
        await loadGoogleMapsPlaces(GOOGLE_MAPS_API_KEY);

        if (cancelled) return;

        if (!window.google?.maps?.places?.Autocomplete) {
          throw new Error('Places API not available');
        }

        if (!autocompleteInputRef.current) return;

        autocompleteInstance = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'formatted_phone_number'
          ]
        });

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();

          if (place?.name) setName(place.name);
          if (place?.formatted_address) setAddress(place.formatted_address);
          if (place?.formatted_phone_number) setPhone(place.formatted_phone_number);
          if (place?.geometry?.location) {
            setLocation({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        });

        setPlacesState('ready');
        setPlacesMessage(t('googleMapsEnabled'));
      } catch (error) {
        console.error('Google Places error:', error);
        if (!cancelled) {
          setPlacesState('error');
          setPlacesMessage(t('googleMapsFailed'));
        }
      }
    };

    loadPlaces();

    return () => {
      cancelled = true;
      window.gm_authFailure = prevAuthFailure;
      if (autocompleteInstance && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [t]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      window.alert(t('restaurantNameRequired'));
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'Restaurant'), {
        Name: name.trim(),
        Address: address.trim(),
        Phone: phone.trim(),
        Email: email.trim(),
        PhotoURL: photoURL.trim() || 'https://via.placeholder.com/400x320?text=Restaurant',
        Location: { latitude: location.lat, longitude: location.lng }
      });

      window.alert(t('restaurantCreated'));
      onBack();
    } catch (error) {
      console.error(error);
      window.alert(t('restaurantCreateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">{t('adminLabel')}</p>
      <h1 className="admin-main-title">{t('addRestaurantTitle')}</h1>
      <p className="admin-description">{t('addRestaurantDescription')}</p>

      <div className="admin-card restaurant-admin-form">
        <div className="places-search-card">
          <div className="input-group full-width">
            <label className="places-search-label">{t('googleMapsSearch')}</label>
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder={t('googleMapsPlaceholder')}
              disabled={placesState === 'disabled'}
            />
          </div>
          <p className="places-status">{placesMessage}</p>
        </div>

        <div className="form-grid">
          <div className="input-group full-width">
            <label>{t('restaurantNameLabel')}</label>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div className="input-group full-width">
            <label>{t('addressLabel')}</label>
            <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>

          <div className="input-group">
            <label>{t('phoneLabel')}</label>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>

          <div className="input-group">
            <label>{t('contactEmailLabel')}</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div className="input-group full-width">
            <label>{t('photoUrlLabel')}</label>
            <input
              type="url"
              value={photoURL}
              onChange={(event) => setPhotoURL(event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="restaurant-map-editor">
          <label className="contact-label">{t('mapPositionLabel')}</label>
          <p className="map-coordinates">
            {t('coordinatesLabel')}: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
          <div className="map-wrapper map-wrapper-admin">
            <MapContainer center={[location.lat, location.lng]} zoom={15} scrollWheelZoom={false} className="map-panel">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater location={location} />
              <LocationMarker location={location} onLocationChange={setLocation} />
            </MapContainer>
          </div>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('cancel')}
        </button>
        <button type="submit" className="btn-joviat" disabled={loading}>
          {loading ? t('saving') : t('saveRestaurant')}
        </button>
      </div>
    </form>
  );
};

export default AddRestaurant;
