export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export function getCurrentPosition(timeout = 10000): Promise<GeoPosition | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // User denied or error — return null silently
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 60000,
      }
    );
  });
}
