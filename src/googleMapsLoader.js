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
    const existingScript = document.querySelector('script[data-google-maps-loader="true"]');
    if (existingScript) {
      const poll = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(poll);
          resolve(window.google);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(poll);
        googleMapsPromise = null;
        reject(new Error('Google Maps timeout'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("No s'ha pogut carregar Google Maps."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
