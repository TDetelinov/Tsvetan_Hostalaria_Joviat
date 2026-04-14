import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corregim la icona per defecte de Leaflet
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
  const [location, setLocation] = useState({ lat: 41.728, lng: 1.823 }); // Manresa per defecte
  const [loading, setLoading] = useState(false);

  // Component per detectar el clic al mapa i moure el marcador
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
    if (!name) return alert("El nom és obligatori");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "Restaurant"), {
        Name: name,
        Address: address,
        Phone: phone,
        Email: email,
        PhotoURL: photoURL || 'https://via.placeholder.com/400x300?text=Sense+Foto',
        Location: { latitude: location.lat, longitude: location.lng }
      });
      alert("Restaurant creat correctament!");
      onBack();
    } catch (error) {
      console.error(error);
      alert("Error en crear el restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="section-header">
        <h2>Alta de Nou Restaurant</h2>
        <div className="underline"></div>
      </div>

      <form onSubmit={handleSubmit} className="minimal-form">
        <div className="form-grid">
          <div className="input-group full-width">
            <label>Nom del Restaurant</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Can Jubany" required />
          </div>
          
          <div className="input-group">
            <label>Adreça</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Carrer, Ciutat" />
          </div>

          <div className="input-group">
            <label>URL Foto (Opcional)</label>
            <input type="url" value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="https://..." />
          </div>

          <div className="input-group">
            <label>Telèfon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email de contacte</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--joviat-gold)', textTransform: 'uppercase' }}>
            Ubica'l al mapa (Clica per moure el marcador)
          </label>
          <div style={{ height: '300px', width: '100%', marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <MapContainer center={[41.728, 1.823]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>
            Coordenades: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>

        <div className="form-actions">
          <button type="button" className="profile-button" style={{ background: '#666', marginRight: '10px', width: 'auto' }} onClick={onBack}>Cancel·lar</button>
          <button type="submit" className="btn-joviat" style={{ width: 'auto', padding: '12px 30px' }} disabled={loading}>
            {loading ? 'Guardant...' : 'Desar Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRestaurant;