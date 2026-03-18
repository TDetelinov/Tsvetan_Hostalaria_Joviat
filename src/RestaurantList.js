import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import RestaurantProfile from './RestaurantProfile';
import 'leaflet/dist/leaflet.css';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const querySnapshot = await getDocs(collection(db, "Restaurant"));
      setRestaurants(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  if (selectedRestaurant) return <RestaurantProfile restaurant={selectedRestaurant} onBack={() => setSelectedRestaurant(null)} />;
  if (loading) return <div className="loader">Carregant...</div>;

  const filtered = restaurants.filter(r => r.Name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <section>
      <div className="section-header">
        <h2>Mapa i Restaurants</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input type="text" placeholder="Cerca restaurant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={[41.7286, 1.8219]} zoom={13} style={{ height: "350px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filtered.map(res => res.Location && (
            <Marker key={res.id} position={[res.Location.latitude, res.Location.longitude]}><Popup>{res.Name}</Popup></Marker>
          ))}
        </MapContainer>
      </div>

      <div className="data-grid">
        {filtered.map(res => (
          <div key={res.id} className="card">
            <div className="card-img-container">
              <img src={res.PhotoURL || 'https://via.placeholder.com/300'} className="card-img" alt={res.Name} />
            </div>
            <div className="card-body">
              <h3>{res.Name}</h3>
              <p>📍 {res.Address}</p>
            </div>
            <button className="btn-joviat" onClick={() => setSelectedRestaurant(res)}>Veure Detalls</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestaurantList;