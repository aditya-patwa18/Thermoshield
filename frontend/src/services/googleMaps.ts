import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let googleMapsPromise: Promise<any> | null = null;
let googleMapsAuthFailed = false;
const authFailureListeners = new Set<() => void>();

const installAuthFailureHandler = () => {
  const windowWithMaps = window as any;
  if (windowWithMaps.__thermalShieldAuthHookInstalled) return;

  const previousHandler = windowWithMaps.gm_authFailure;
  windowWithMaps.gm_authFailure = () => {
    googleMapsAuthFailed = true;
    previousHandler?.();
    authFailureListeners.forEach((listener) => listener());
  };
  windowWithMaps.__thermalShieldAuthHookInstalled = true;
};

export const onGoogleMapsAuthFailure = (listener: () => void): (() => void) => {
  authFailureListeners.add(listener);
  if (googleMapsAuthFailed) listener();
  return () => authFailureListeners.delete(listener);
};

export const loadGoogleMaps = (): Promise<any> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is missing.'));

  if (!googleMapsPromise) {
    installAuthFailureHandler();
    setOptions({ key: apiKey, v: 'weekly' });
    googleMapsPromise = Promise.all([importLibrary('maps'), importLibrary('places')])
      .then(() => (window as any).google.maps)
  }

  return googleMapsPromise;
};