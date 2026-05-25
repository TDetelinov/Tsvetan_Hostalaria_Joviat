let googleMapsPromise = null;

export const loadGoogleMapsPlaces = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error("No s'ha definit cap clau de Google Maps."));
  }

  if (window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__googleMapsPlacesReady';

    const existingScript = document.querySelector('script[data-google-maps-loader="true"]');
    if (existingScript) {
      if (window.google?.maps?.places?.Autocomplete) {
        resolve(window.google);
      } else {
        window[callbackName] = () => resolve(window.google);
      }
      return;
    }

    window[callbackName] = () => {
      resolve(window.google);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("No s'ha pogut carregar Google Maps."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
