import { useState, useEffect } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Default to a scenic spot (e.g., Santa Monica) if permission denied for demo
    // but the prompt says real geolocation.
    const success = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn(`Geolocation error: ${error.message}`);
      // Fallback for development if needed, but let's try real first
      setError(error.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, handleError);
  }, []);

  return { location, error, loading };
}
