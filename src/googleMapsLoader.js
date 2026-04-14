let googleMapsPromise = null;

export const loadGoogleMapsPlaces = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('No s’ha definit cap clau de Google Maps.'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps-loader="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', () => reject(new Error('No s’ha pogut carregar Google Maps.')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('No s’ha pogut carregar Google Maps.'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
