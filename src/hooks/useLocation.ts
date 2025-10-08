// src/hooks/useLocation.ts
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationWithCoords extends Location.LocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
}

export default function useLocation() {
  const [location, setLocation] = useState<LocationWithCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão negada para localização');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return { location, error };
}
