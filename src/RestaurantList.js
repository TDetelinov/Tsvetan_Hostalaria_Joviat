import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { MapContainer, Marker, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import { db } from './firebase';
import { useI18n } from './i18n';
import PaginationControls from './PaginationControls';
import 'leaflet/dist/leaflet.css';

const PAGE_SIZE = 9;
const CLUSTER_RADIUS_PX = 55;

const DEFAULT_RESTAURANT_IMG = 'https://via.placeholder.com/300x200?text=Restaurant';
const DEFAULT_STUDENT_IMG = 'https://via.placeholder.com/48x48?text=Alumne';

const makeMarkerIcon = () =>
  L.divIcon({
    html: `<div class="joviat-pin"><img src="https://shoponline.unilabor.com/c/51-category_default/joviat.jpg" alt="Joviat" /></div>`,
    className: 'joviat-pin-wrapper',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

const makeClusterIcon = (count) =>
  L.divIcon({
    html: `<div class="cluster-marker">${count}</div>`,
    className: 'cluster-marker-wrapper',
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });

const computeClusters = (restaurants, map) => {
  const positioned = restaurants.filter((r) => r.Location);
  if (!positioned.length || !map) return { clusters: [], singles: [] };

  const points = positioned.map((r) => ({
    r,
    pt: map.latLngToContainerPoint([r.Location.latitude, r.Location.longitude])
  }));

  const used = new Set();
  const clusters = [];
  const singles = [];

  points.forEach((p, i) => {
    if (used.has(i)) return;
    const group = [i];
    points.forEach((q, j) => {
      if (j === i || used.has(j)) return;
      const dx = p.pt.x - q.pt.x;
      const dy = p.pt.y - q.pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS_PX) {
        group.push(j);
      }
    });
    group.forEach((idx) => used.add(idx));

    if (group.length === 1) {
      singles.push(points[i].r);
    } else {
      const members = group.map((idx) => points[idx].r);
      const allLats = members.map((r) => r.Location.latitude);
      const allLngs = members.map((r) => r.Location.longitude);
      clusters.push({
        id: members
          .map((r) => r.id)
          .sort()
          .join('|'),
        lat: allLats.reduce((a, b) => a + b) / allLats.length,
        lng: allLngs.reduce((a, b) => a + b) / allLngs.length,
        count: members.length,
        restaurants: members
      });
    }
  });

  return { clusters, singles };
};

const MapBoundsUpdater = ({ restaurants }) => {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const positioned = restaurants.filter((r) => r.Location);
    if (positioned.length === 0) {
      map.setView([41.7286, 1.8219], 8);
    } else {
      const bounds = L.latLngBounds(
        positioned.map((r) => [r.Location.latitude, r.Location.longitude])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: false });
    }
    initialized.current = true;
  }, [restaurants, map]);

  return null;
};

const MapMarkers = ({ restaurants, onMarkerClick }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const markerIcon = useMemo(() => makeMarkerIcon(), []);

  useMapEvent('zoomend', () => {
    setZoom(map.getZoom());
  });

  const { clusters, singles } = useMemo(
    () => computeClusters(restaurants, map),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurants, zoom]
  );

  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={`cluster-${cluster.id}`}
          position={[cluster.lat, cluster.lng]}
          icon={makeClusterIcon(cluster.count)}
          eventHandlers={{
            click: () => {
              const newZoom = Math.min(map.getZoom() + 3, 18);
              map.setView([cluster.lat, cluster.lng], newZoom, { animate: false });
            }
          }}
        />
      ))}
      {singles.map((restaurant) => (
        <Marker
          key={`single-${restaurant.id}`}
          position={[restaurant.Location.latitude, restaurant.Location.longitude]}
          icon={markerIcon}
          eventHandlers={{
            click: () => onMarkerClick(restaurant)
          }}
        />
      ))}
    </>
  );
};

const MapPopupOverlay = ({ restaurant, onClose, onSelect, t, tCount }) => {
  const visibleWorkers = (restaurant.workers || []).slice(0, 3);
  const remaining = (restaurant.workers || []).length - visibleWorkers.length;

  return (
    <div className="map-overlay-popup">
      <button type="button" className="map-overlay-close" onClick={onClose} aria-label="Tancar">
        ✕
      </button>
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
          onClick={() => {
            onClose();
            onSelect(restaurant);
          }}
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
  const [viewMode, setViewMode] = useState(state?.viewMode || 'map');

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
    onStateChange?.({ searchTerm, currentPage, viewMode });
  }, [searchTerm, currentPage, viewMode, onStateChange]);

  const filteredRestaurants = useMemo(
    () => restaurants.filter((r) => r.Name?.toLowerCase().includes(searchTerm.toLowerCase())),
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
        <div className="view-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            {t('viewMap')}
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => { setViewMode('list'); setPopupRestaurant(null); }}
          >
            {t('viewList')}
          </button>
        </div>
      </div>

      {viewMode === 'map' && (
        <div className="map-wrapper map-wrapper-relative">
          <MapContainer
            center={[41.7286, 1.8219]}
            zoom={8}
            scrollWheelZoom={false}
            className="map-panel map-panel-large"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapBoundsUpdater restaurants={filteredRestaurants} />
            <MapMarkers
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
      )}

      {viewMode === 'list' && (
        <>
          <div className="data-grid">
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
        </>
      )}
    </section>
  );
};

export default RestaurantList;
