import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { db } from './firebase';
import { useI18n } from './i18n';
import PaginationControls from './PaginationControls';
import 'leaflet/dist/leaflet.css';

const PAGE_SIZE = 9;

const DEFAULT_RESTAURANT_IMG = 'https://via.placeholder.com/300x200?text=Restaurant';
const DEFAULT_STUDENT_IMG = 'https://via.placeholder.com/48x48?text=Alumne';

const markerIcon = L.divIcon({
  html: `<div class="joviat-pin"><img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Joviat" /></div>`,
  className: 'joviat-pin-wrapper',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40]
});

const MapBoundsUpdater = ({ restaurants }) => {
  const map = useMap();

  useEffect(() => {
    const positioned = restaurants.filter((r) => r.Location);
    if (positioned.length === 0) {
      map.setView([41.7286, 1.8219], 8);
      return;
    }
    const bounds = L.latLngBounds(
      positioned.map((r) => [r.Location.latitude, r.Location.longitude])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: false });
  }, [restaurants, map]);

  return null;
};

const LeafletClusterGroup = ({ restaurants, onMarkerClick }) => {
  const map = useMap();
  const callbackRef = useRef(onMarkerClick);
  const groupRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<div class="cluster-marker">${cluster.getChildCount()}</div>`,
          className: 'cluster-marker-wrapper',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        }),
      maxClusterRadius: 80,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      animate: false,
      animateAddingMarkers: false
    });

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.clearLayers();

    restaurants.forEach((restaurant) => {
      if (!restaurant.Location) return;
      const marker = L.marker(
        [restaurant.Location.latitude, restaurant.Location.longitude],
        { icon: markerIcon }
      );
      marker.on('click', () => callbackRef.current(restaurant));
      group.addLayer(marker);
    });
  }, [restaurants]);

  return null;
};

const MapPopupOverlay = ({ restaurant, onClose, onSelect, t, tCount }) => {
  const visibleWorkers = (restaurant.workers || []).slice(0, 3);
  const remaining = (restaurant.workers || []).length - visibleWorkers.length;

  return (
    <div className="map-overlay-popup">
      <button type="button" className="map-overlay-close" onClick={onClose} aria-label="Tancar">✕</button>
      <img
        src={restaurant.PhotoURL || DEFAULT_RESTAURANT_IMG}
        alt={restaurant.Name}
        className="map-overlay-img"
      />
      <div className="map-overlay-body">
        <h4 className="map-overlay-name">{restaurant.Name}</h4>
        {restaurant.Address && <p className="map-overlay-address">{restaurant.Address}</p>}

        {(restaurant.workers || []).length > 0 && (
          <div className="popup-workers-summary">
            <span className="popup-workers-count">
              {restaurant.workers.length} {tCount('linkedStudents', restaurant.workers.length)}
            </span>
            <div className="popup-workers-avatars">
              {visibleWorkers.map((w) => (
                <img
                  key={w.id}
                  src={w.PhotoURL || DEFAULT_STUDENT_IMG}
                  alt={w.Name || t('statusStudent')}
                  className="popup-worker-avatar"
                />
              ))}
              {remaining > 0 && <span className="popup-worker-extra">+{remaining}</span>}
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-joviat popup-detail-button"
          onClick={() => { onClose(); onSelect(restaurant); }}
        >
          {t('viewDetails')}
        </button>
      </div>
    </div>
  );
};

const RestaurantList = ({ onSelect, state, onStateChange }) => {
  const { t, tCount } = useI18n();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(state?.currentPage || 1);
  const [popupRestaurant, setPopupRestaurant] = useState(null);

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
          if (!relation.id_restaurant || !worker) return;
          if (!workersByRestaurant.has(relation.id_restaurant)) {
            workersByRestaurant.set(relation.id_restaurant, []);
          }
          const list = workersByRestaurant.get(relation.id_restaurant);
          if (!list.some((w) => w.id === worker.id)) list.push(worker);
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
    setPopupRestaurant(null);
  }, [searchTerm]);

  useEffect(() => {
    onStateChange?.({ searchTerm, currentPage });
  }, [searchTerm, currentPage, onStateChange]);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((r) =>
        r.Name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [restaurants, searchTerm]
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
      </div>

      <div className="map-wrapper map-wrapper-relative">
        <MapContainer
          center={[41.7286, 1.8219]}
          zoom={8}
          scrollWheelZoom={false}
          className="map-panel map-panel-large"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBoundsUpdater restaurants={filteredRestaurants} />
          <LeafletClusterGroup
            restaurants={filteredRestaurants}
            onMarkerClick={setPopupRestaurant}
          />
        </MapContainer>

        {popupRestaurant && (
          <MapPopupOverlay
            restaurant={popupRestaurant}
            onClose={() => setPopupRestaurant(null)}
            onSelect={onSelect}
            t={t}
            tCount={tCount}
          />
        )}
      </div>

      <div className="data-grid" style={{ marginTop: '2rem' }}>
        {paginatedRestaurants.map((restaurant) => (
          <article
            key={restaurant.id}
            className="card card-clickable"
            onClick={() => onSelect(restaurant)}
          >
            <div className="card-img-container">
              <img
                src={restaurant.PhotoURL || DEFAULT_RESTAURANT_IMG}
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
          </article>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <p className="no-data">{t('noRestaurantsFound')}</p>
      )}

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
