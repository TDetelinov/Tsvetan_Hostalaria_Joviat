import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import { useI18n } from './i18n';
import PaginationControls from './PaginationControls';
import 'leaflet/dist/leaflet.css';

const PAGE_SIZE = 10;
const CLUSTER_DISTANCE_METERS = 180;

const markerIcon = L.divIcon({
  html: `<div class="joviat-pin"><img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Joviat" /></div>`,
  className: 'joviat-pin-wrapper',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
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
  const positioned = restaurants.filter((restaurant) => restaurant.Location);
  const visited = new Set();
  const clusters = [];

  positioned.forEach((restaurant, index) => {
    if (visited.has(index)) {
      return;
    }

    const queue = [index];
    const members = [];
    visited.add(index);

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      const currentRestaurant = positioned[currentIndex];
      members.push(currentRestaurant);

      for (let nextIndex = 0; nextIndex < positioned.length; nextIndex += 1) {
        if (visited.has(nextIndex)) {
          continue;
        }

        const candidate = positioned[nextIndex];
        const distance = getDistanceMeters(
          currentRestaurant.Location.latitude,
          currentRestaurant.Location.longitude,
          candidate.Location.latitude,
          candidate.Location.longitude
        );

        if (distance <= CLUSTER_DISTANCE_METERS) {
          visited.add(nextIndex);
          queue.push(nextIndex);
        }
      }
    }

    const sum = members.reduce(
      (accumulator, current) => ({
        lat: accumulator.lat + current.Location.latitude,
        lng: accumulator.lng + current.Location.longitude
      }),
      { lat: 0, lng: 0 }
    );

    clusters.push({
      id: `cluster-${members.map((member) => member.id).join('-')}`,
      restaurants: members,
      center: {
        lat: sum.lat / members.length,
        lng: sum.lng / members.length
      }
    });
  });

  return clusters;
};

const MapBoundsUpdater = ({ restaurants }) => {
  const map = useMap();

  useEffect(() => {
    if (restaurants.length === 0) {
      map.setView([41.7286, 1.8219], 8);
      return;
    }

    const bounds = L.latLngBounds(
      restaurants.map((restaurant) => [restaurant.Location.latitude, restaurant.Location.longitude])
    );

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [restaurants, map]);

  return null;
};

const RestaurantPopupCard = ({ restaurant, onSelect }) => {
  const { t, tCount } = useI18n();
  const visibleWorkers = restaurant.workers.slice(0, 3);
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
        <p>{restaurant.Address || t('popupNoAddress')}</p>

        <div className="popup-workers-summary">
          <span className="popup-workers-count">
            {restaurant.workers.length} {tCount('linkedStudents', restaurant.workers.length)}
          </span>

          <div className="popup-workers-avatars">
            {visibleWorkers.map((worker) => (
              <img
                key={worker.id}
                src={worker.PhotoURL || 'https://via.placeholder.com/48x48?text=Alumne'}
                alt={worker.Name || t('statusStudent')}
                className="popup-worker-avatar"
              />
            ))}

            {remainingWorkers > 0 && <span className="popup-worker-extra">+{remainingWorkers}</span>}
          </div>
        </div>

        <button type="button" className="btn-joviat popup-detail-button" onClick={() => onSelect(restaurant)}>
          {t('viewDetails')}
        </button>
      </div>
    </article>
  );
};

const RestaurantList = ({ onSelect, state, onStateChange }) => {
  const { t, tCount } = useI18n();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(state?.currentPage || 1);
  const [viewMode, setViewMode] = useState(state?.viewMode || 'map');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const [restaurantSnapshot, relationSnapshot, alumniSnapshot] = await Promise.all([
          getDocs(collection(db, 'Restaurant')),
          getDocs(collection(db, 'Rest_Alum')),
          getDocs(collection(db, 'Alumni'))
        ]);

        const alumniById = new Map(alumniSnapshot.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]));
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

        setRestaurants(
          restaurantSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            workers: workersByRestaurant.get(doc.id) || []
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    onStateChange?.({ searchTerm, currentPage, viewMode });
  }, [searchTerm, currentPage, viewMode, onStateChange]);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) =>
        restaurant.Name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [restaurants, searchTerm]
  );

  const restaurantClusters = useMemo(
    () => buildRestaurantClusters(filteredRestaurants),
    [filteredRestaurants]
  );

  if (loading) {
    return <div className="loader">{t('loadingRestaurants')}</div>;
  }

  const totalItems = filteredRestaurants.length;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRestaurants = filteredRestaurants.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="content-section">
      <div className="section-header">
        <p className="section-kicker">{t('restaurantSectionKicker')}</p>
        <h2>{t('restaurantSectionTitle')}</h2>
        <div className="underline"></div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('searchRestaurants')}
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
          {totalItems} {tCount('restaurantFound', totalItems)}
        </p>

        <div className="view-switch">
          <button
            type="button"
            className={`view-switch-button ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            {t('mapMode')}
          </button>
          <button
            type="button"
            className={`view-switch-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            {t('listMode')}
          </button>
        </div>
      </div>

      {viewMode === 'map' && (
        <div className="map-wrapper">
          <MapContainer center={[41.7286, 1.8219]} zoom={8} className="map-panel map-panel-large">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapBoundsUpdater restaurants={filteredRestaurants.filter((restaurant) => restaurant.Location)} />
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
                        <strong>{tCount('clusterTitle', cluster.restaurants.length)}</strong>
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
      )}

      {viewMode === 'list' && (
        <>
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
                  <p>{restaurant.Address || t('noAddress')}</p>
                  <p>
                    {restaurant.workers.length} {tCount('linkedStudents', restaurant.workers.length)}
                  </p>
                </div>
                <button className="btn-joviat card-action" type="button" onClick={() => onSelect(restaurant)}>
                  {t('viewDetails')}
                </button>
              </article>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {filteredRestaurants.length === 0 && <p className="no-data">{t('noRestaurantsFound')}</p>}
    </section>
  );
};

export default RestaurantList;
