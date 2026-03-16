import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Recorda que la col·lecció es diu "Restaurant"
        const querySnapshot = await getDocs(collection(db, "Restaurant"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRestaurants(data);
        setLoading(false);
      } catch (e) { console.error(e); }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(r => 
    r.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loader">Carregant restaurants...</div>;

  return (
    <div className="restaurant-page">
      <div className="section-header">
        <h2>Mapa i Restaurants</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Cerca restaurant..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={[41.7286, 1.8219]} zoom={13} style={{ height: "400px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredRestaurants.map(res => (
            res.Location && (
              <Marker key={res.id} position={[res.Location.latitude, res.Location.longitude]}>
                <Popup>{res.Name}</Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* QUADRÍCULA DE RESTAURANTS */}
      <div className="student-grid"> {/* Fem servir la mateixa classe de la quadrícula */}
        {filteredRestaurants.map(res => (
          <div key={res.id} className="student-card">
            <div className="image-container" style={{height: '150px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <span style={{fontSize: '3rem'}}>🍴</span>
            </div>
            <div className="student-info">
              <h3>{res.Name}</h3>
              <p>📍 Restaurant Joviat</p>
              <button className="profile-button">Veure Detalls</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;