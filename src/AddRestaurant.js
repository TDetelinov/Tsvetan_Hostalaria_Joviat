import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icona per defecte de Leaflet
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Component intern que fa que el mapa es mogui a les coordenades cercades
const MapUpdater = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16); // 16 és el nivell de zoom en apropar-se
  }, [location, map]);
  return null;
};

const AddRestaurant = ({ onBack }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [location, setLocation] = useState({ lat: 41.7286, lng: 1.8219 }); // Joviat per defecte
  const [loading, setLoading] = useState(false);

  // Referència per al camp de cerca de Google Places
  const autocompleteRef = useRef(null);

  // Inicialitzar Google Places
  useEffect(() => {
    let autocomplete;

    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && autocompleteRef.current) {
        autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
          fields: ['name', 'formatted_address', 'geometry', 'formatted_phone_number'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          // Omplim les dades automàticament
          if (place.geometry && place.geometry.location) {
            setLocation({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
          if (place.name) setName(place.name);
          if (place.formatted_address) setAddress(place.formatted_address);
          if (place.formatted_phone_number) setPhone(place.formatted_phone_number);
        });
      }
    };

    // Comprovem si l'API ja està carregada. Si no, fem un petit interval d'espera (útil si carregues de forma asíncrona)
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          initAutocomplete();
          clearInterval(checkGoogle);
        }
      }, 500);
      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Detector de clics al mapa per afinar la ubicació manualment
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return <Marker position={[location.lat, location.lng]} icon={icon} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return window.alert('El nom és obligatori');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'Restaurant'), {
        Name: name,
        Address: address,
        Phone: phone,
        Email: email,
        PhotoURL: photoURL || 'https://via.placeholder.com/400x320?text=Sense+Foto',
        Location: { latitude: location.lat, longitude: location.lng }
      });
      window.alert('Restaurant creat correctament!');
      onBack();
    } catch (error) {
      console.error(error);
      window.alert('Error en crear el restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section-wrapper">
      <p className="admin-label-top">ADMINISTRACIÓ</p>
      <h1 className="admin-main-title">Nou Restaurant</h1>
      <p className="admin-description">
        Cerca el restaurant per autocompletar les dades, o omple el formulari manualment.
      </p>

      <form onSubmit={handleSubmit} className="admin-card" style={{ marginTop: '20px' }}>
        
        {/* CAMP GOOGLE PLACES */}
        <div className="input-group full-width" style={{ marginBottom: '30px', background: '#fff', padding: '15px', borderRadius: '12px', border: '2px solid var(--joviat-gold)' }}>
          <label style={{ color: 'var(--joviat-gold)' }}>🔍 Cerca a Google Maps (Autocompletar)</label>
          <input 
            type="text" 
            ref={autocompleteRef} 
            placeholder="Comença a escriure el nom del restaurant o l'adreça..." 
            style={{ borderBottom: 'none', fontSize: '1.1rem', background: 'transparent' }}
          />
        </div>

        <div className="form-grid">
          <div className="input-group full-width">
            <label>Nom del Restaurant *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="input-group full-width">
            <label>Adreça</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Telèfon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email de contacte</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="input-group full-width">
            <label>URL de la Foto</label>
            <input type="url" value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <label className="contact-label" style={{ marginBottom: '10px', display: 'block' }}>
            Posició al mapa (Pots fer clic per corregir la ubicació)
          </label>
          <div className="map-wrapper" style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater location={location} />
              <LocationMarker />
            </MapContainer>
          </div>
        </div>

        <div className="form-submit-actions" style={{ marginTop: '40px' }}>
          <button type="button" className="btn-secondary" onClick={onBack}>Cancel·lar</button>
          <button type="submit" className="btn-joviat" disabled={loading}>
            {loading ? 'Guardant...' : 'Desar Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRestaurant;