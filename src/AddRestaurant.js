import React, { useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { loadGoogleMapsPlaces } from './googleMapsLoader';

const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

const AddRestaurant = ({ onBack }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [location, setLocation] = useState({ lat: 41.728, lng: 1.823 });
  const [loading, setLoading] = useState(false);
  const [placesStatus, setPlacesStatus] = useState(
    googleMapsApiKey
      ? 'Carregant Google Places...'
      : 'Afegeix la clau de Google Maps al fitxer .env per activar l’autocompletat de llocs.'
  );
  const autocompleteInputRef = useRef(null);
  const autocompleteInstanceRef = useRef(null);

  useEffect(() => {
    let active = true;

    if (!googleMapsApiKey || !autocompleteInputRef.current) {
      return undefined;
    }

    const setupAutocomplete = async () => {
      try {
        await loadGoogleMapsPlaces(googleMapsApiKey);
        if (!active || !window.google?.maps?.places || !autocompleteInputRef.current) {
          return;
        }

        autocompleteInstanceRef.current = new window.google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          {
            fields: ['name', 'formatted_address', 'geometry'],
            types: ['establishment'],
            componentRestrictions: { country: ['es'] }
          }
        );

        autocompleteInstanceRef.current.addListener('place_changed', () => {
          const place = autocompleteInstanceRef.current?.getPlace();

          if (!place) {
            return;
          }

          if (place.name) {
            setName(place.name);
          }

          if (place.formatted_address) {
            setAddress(place.formatted_address);
          }

          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();
          if (typeof lat === 'number' && typeof lng === 'number') {
            setLocation({ lat, lng });
          }
        });

        setPlacesStatus('Google Places actiu. Pots cercar un establiment i omplir automàticament el nom, l’adreça i la ubicació.');
      } catch (error) {
        console.error(error);
        if (active) {
          setPlacesStatus('No s’ha pogut carregar Google Places. Pots continuar omplint el formulari manualment.');
        }
      }
    };

    setupAutocomplete();

    return () => {
      active = false;
    };
  }, []);

  const LocationMarker = () => {
    useMapEvents({
      click(event) {
        setLocation({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    });

    return <Marker position={[location.lat, location.lng]} icon={icon} />;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      window.alert('El nom del restaurant és obligatori.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'Restaurant'), {
        Name: name.trim(),
        Address: address.trim(),
        Phone: phone.trim(),
        Email: email.trim(),
        PhotoURL: photoURL.trim() || 'https://via.placeholder.com/400x300?text=Sense+Foto',
        Location: { latitude: location.lat, longitude: location.lng }
      });

      window.alert('Restaurant creat correctament.');
      onBack();
    } catch (error) {
      console.error(error);
      window.alert('Hi ha hagut un error en crear el restaurant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">Administració</p>
      <h1 className="admin-main-title">Alta de nou restaurant</h1>
      <p className="admin-description">
        Afegeix les dades principals del restaurant i situa l’establiment al mapa. Si tens activa la clau de Google Places,
        pots cercar-lo i omplir part del formulari automàticament.
      </p>

      <div className="admin-card trajectoria-card">
        <div className="trajectoria-header">
          <div>
            <p className="admin-label-top">Google Places</p>
            <h3 className="admin-card-title">Cerca d’establiments</h3>
          </div>
        </div>

        <p className="places-status">{placesStatus}</p>

        <div className="input-group full-width">
          <label>Cerca un restaurant</label>
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Escriu el nom del restaurant o l’adreça"
            disabled={!googleMapsApiKey}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="form-grid">
          <div className="input-group full-width">
            <label>Nom del restaurant</label>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Can Jubany" required />
          </div>

          <div className="input-group">
            <label>Adreça</label>
            <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Carrer, ciutat" />
          </div>

          <div className="input-group">
            <label>URL de la foto</label>
            <input type="url" value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} placeholder="https://..." />
          </div>

          <div className="input-group">
            <label>Telèfon</label>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>

          <div className="input-group">
            <label>Correu de contacte</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-card trajectoria-card">
        <div className="trajectoria-header">
          <div>
            <p className="admin-label-top">Localització</p>
            <h3 className="admin-card-title">Ubicació al mapa</h3>
          </div>
          <p className="map-coordinates">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>

        <div className="map-wrapper map-wrapper-admin">
          <MapContainer center={[location.lat, location.lng]} zoom={13} className="map-panel">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap center={[location.lat, location.lng]} />
            <LocationMarker />
          </MapContainer>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Cancel·lar
        </button>
        <button type="submit" className="btn-joviat" disabled={loading}>
          {loading ? 'Desant...' : 'Desar restaurant'}
        </button>
      </div>
    </form>
  );
};

export default AddRestaurant;
