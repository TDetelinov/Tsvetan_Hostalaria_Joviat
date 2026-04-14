import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RestaurantList = ({ onSelect }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const querySnapshot = await getDocs(collection(db, 'Restaurant'));
      setRestaurants(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return <div className="loader">Carregant restaurants...</div>;
  }

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="content-section">
      <div className="section-header">
        <p className="section-kicker">Mapa de col laboradors</p>
        <h2>Restaurants vinculats</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Cerca restaurant..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" type="button" onClick={() => setSearchTerm('')}>
              x
            </button>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={[41.7286, 1.8219]} zoom={13} className="map-panel">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredRestaurants.map(
            (restaurant) =>
              restaurant.Location && (
                <Marker
                  key={restaurant.id}
                  position={[restaurant.Location.latitude, restaurant.Location.longitude]}
                >
                  <Popup>{restaurant.Name}</Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>

      <div className="data-grid">
        {filteredRestaurants.map((restaurant) => (
          <article key={restaurant.id} className="card">
            <div className="card-img-container">
              <img
                src={restaurant.PhotoURL || 'https://via.placeholder.com/300x360?text=Sense+Foto'}
                className="card-img"
                alt={restaurant.Name}
              />
            </div>
            <div className="card-body">
              <h3>{restaurant.Name}</h3>
              <p>{restaurant.Address || 'Sense adreca'}</p>
            </div>
            <button className="btn-joviat card-action" type="button" onClick={() => onSelect(restaurant)}>
              Veure detalls
            </button>
          </article>
        ))}
      </div>

      {filteredRestaurants.length === 0 && <p className="no-data">No s han trobat restaurants amb aquest nom.</p>}
    </section>
  );
};

export default RestaurantList;
