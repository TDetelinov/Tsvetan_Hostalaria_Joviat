import React, { useState } from 'react';
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const AddRestaurant = ({ onBack }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [location, setLocation] = useState({ lat: 41.728, lng: 1.823 });
  const [loading, setLoading] = useState(false);

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
      window.alert('El nom del restaurant es obligatori.');
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
      window.alert('Error en crear el restaurant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-section-wrapper">
      <p className="admin-label-top">Administracio</p>
      <h1 className="admin-main-title">Alta de nou restaurant</h1>
      <p className="admin-description">
        Afegeix les dades principals del restaurant i situa l establiment al mapa per mostrar-lo correctament al directori.
      </p>

      <div className="admin-card">
        <div className="form-grid">
          <div className="input-group full-width">
            <label>Nom del restaurant</label>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Can Jubany" required />
          </div>

          <div className="input-group">
            <label>Adreca</label>
            <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Carrer, ciutat" />
          </div>

          <div className="input-group">
            <label>URL de la foto</label>
            <input type="url" value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} placeholder="https://..." />
          </div>

          <div className="input-group">
            <label>Telefon</label>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>

          <div className="input-group">
            <label>Email de contacte</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-card trajectoria-card">
        <div className="trajectoria-header">
          <div>
            <p className="admin-label-top">Localitzacio</p>
            <h3 className="admin-card-title">Ubicacio al mapa</h3>
          </div>
          <p className="map-coordinates">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>

        <div className="map-wrapper map-wrapper-admin">
          <MapContainer center={[41.728, 1.823]} zoom={13} className="map-panel">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker />
          </MapContainer>
        </div>
      </div>

      <div className="form-submit-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Cancel lar
        </button>
        <button type="submit" className="btn-joviat" disabled={loading}>
          {loading ? 'Guardant...' : 'Desar restaurant'}
        </button>
      </div>
    </form>
  );
};

export default AddRestaurant;
