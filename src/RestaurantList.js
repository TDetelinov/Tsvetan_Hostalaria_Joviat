import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PaginationControls from './PaginationControls';

const PAGE_SIZE = 10;
const CLUSTER_DISTANCE_METERS = 120;
const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const createClusterIcon = (count) =>
  L.divIcon({
    html: `<div class="cluster-marker">${count}</div>`,
    className: 'cluster-marker-wrapper',
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });

const buildRestaurantClusters = (restaurants) => {
  const clusters = [];

  restaurants.forEach((restaurant) => {
    if (!restaurant.Location) {
      return;
    }

    const currentLocation = {
      lat: restaurant.Location.latitude,
      lng: restaurant.Location.longitude
    };

    const matchingCluster = clusters.find((cluster) => {
      const distance = getDistanceMeters(
        cluster.center.lat,
        cluster.center.lng,
        currentLocation.lat,
        currentLocation.lng
      );

      return distance <= CLUSTER_DISTANCE_METERS;
    });

    if (!matchingCluster) {
      clusters.push({
        id: `cluster-${restaurant.id}`,
        restaurants: [restaurant],
        center: currentLocation,
        sumLat: currentLocation.lat,
        sumLng: currentLocation.lng
      });
      return;
    }

    matchingCluster.restaurants.push(restaurant);
    matchingCluster.sumLat += currentLocation.lat;
    matchingCluster.sumLng += currentLocation.lng;
    matchingCluster.center = {
      lat: matchingCluster.sumLat / matchingCluster.restaurants.length,
      lng: matchingCluster.sumLng / matchingCluster.restaurants.length
    };
  });

  return clusters;
};

const getVisibleWorkers = (workers) => workers.slice(0, 3);

const RestaurantPopupCard = ({ restaurant, onSelect }) => {
  const visibleWorkers = getVisibleWorkers(restaurant.workers);
  const remainingWorkers = restaurant.workers.length - visibleWorkers.length;

  return (
    <article className="map-popup-card">
      <img
        src={restaurant.PhotoURL || 'https://via.placeholder.com/280x180?text=Restaurant'}
        alt={restaurant.Name}
        className="map-popup-image"
      />

      <div className="map-popup-body">
        <h4>{restaurant.Name}</h4>
        <p>{restaurant.Address || 'Adreça no disponible'}</p>

        <div className="popup-workers-summary">
          <span className="popup-workers-count">
            {restaurant.workers.length} {restaurant.workers.length === 1 ? 'alumne vinculat' : 'alumnes vinculats'}
          </span>

          <div className="popup-workers-avatars">
            {visibleWorkers.map((worker) => (
              <img
                key={worker.id}
                src={worker.PhotoURL || 'https://via.placeholder.com/48x48?text=Alumne'}
                alt={worker.Name || 'Alumne'}
                className="popup-worker-avatar"
              />
            ))}

            {remainingWorkers > 0 && <span className="popup-worker-extra">+{remainingWorkers}</span>}
          </div>
        </div>

        <button type="button" className="btn-joviat popup-detail-button" onClick={() => onSelect(restaurant)}>
          Veure detalls
        </button>
      </div>
    </article>
  );
};

const RestaurantList = ({ onSelect }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const [restaurantSnapshot, relationSnapshot, alumniSnapshot] = await Promise.all([
          getDocs(collection(db, 'Restaurant')),
          getDocs(collection(db, 'Rest_Alum')),
          getDocs(collection(db, 'Alumni'))
        ]);

        const alumniById = new Map(
          alumniSnapshot.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }])
        );

        const workersByRestaurant = new Map();

        relationSnapshot.docs.forEach((relationDoc) => {
          const relation = relationDoc.data();
          const worker = alumniById.get(relation.id_alumni);

          if (!relation.id_restaurant || !worker) {
            return;
          }

          if (!workersByRestaurant.has(relation.id_restaurant)) {
            workersByRestaurant.set(relation.id_restaurant, []);
          }

          const currentWorkers = workersByRestaurant.get(relation.id_restaurant);
          if (!currentWorkers.some((currentWorker) => currentWorker.id === worker.id)) {
            currentWorkers.push(worker);
          }
        });

        const enrichedRestaurants = restaurantSnapshot.docs.map((doc) => {
          const restaurantWorkers = workersByRestaurant.get(doc.id) || [];

          return {
            id: doc.id,
            ...doc.data(),
            workers: restaurantWorkers
          };
        });

        setRestaurants(enrichedRestaurants);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return <div className="loader">Carregant restaurants...</div>;
  }

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredRestaurants.length;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRestaurants = filteredRestaurants.slice(startIndex, startIndex + PAGE_SIZE);
  const restaurantClusters = buildRestaurantClusters(filteredRestaurants);

  return (
    <section className="content-section">
      <div className="section-header">
        <p className="section-kicker">Mapa de col·laboradors</p>
        <h2>Restaurants vinculats</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Cerca un restaurant..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" type="button" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="results-toolbar">
        <p className="results-counter">
          {totalItems} {totalItems === 1 ? 'restaurant trobat' : 'restaurants trobats'}
        </p>
      </div>

      <div className="map-wrapper">
        <MapContainer center={[41.7286, 1.8219]} zoom={13} className="map-panel">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {restaurantClusters.map((cluster) => (
            <Marker
              key={cluster.id}
              position={[cluster.center.lat, cluster.center.lng]}
              icon={cluster.restaurants.length > 1 ? createClusterIcon(cluster.restaurants.length) : markerIcon}
            >
              <Popup maxWidth={320}>
                <div className="map-popup-group">
                  {cluster.restaurants.length > 1 && (
                    <div className="map-popup-group-header">
                      <strong>{cluster.restaurants.length} restaurants en aquesta zona</strong>
                    </div>
                  )}

                  {cluster.restaurants.map((restaurant) => (
                    <RestaurantPopupCard key={restaurant.id} restaurant={restaurant} onSelect={onSelect} />
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="data-grid">
        {paginatedRestaurants.map((restaurant) => (
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
              <p>{restaurant.Address || 'Sense adreça'}</p>
              <p>{restaurant.workers.length} {restaurant.workers.length === 1 ? 'alumne vinculat' : 'alumnes vinculats'}</p>
            </div>
            <button className="btn-joviat card-action" type="button" onClick={() => onSelect(restaurant)}>
              Veure detalls
            </button>
          </article>
        ))}
      </div>

      {filteredRestaurants.length === 0 && <p className="no-data">No s&apos;han trobat restaurants amb aquest nom.</p>}

      <PaginationControls
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />
    </section>
  );
};

export default RestaurantList;
