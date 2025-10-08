// src/screens/MapScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import useLocation from '../hooks/useLocation';
import * as Location from 'expo-location';
import { supabase } from '../api/supabaseClient';
import { Pharmacy } from '../types';

// Função auxiliar para calcular distância entre dois pontos
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distância em km
}

type LocationType = {
  coords: {
    latitude: number;
    longitude: number;
  }
};

type RootStackParamList = {
  Map: { user: { id: string; email: string } };
  Checkin: { pharmacy: Pharmacy; user: { id: string; email: string } };
};

type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;

export default function MapScreen({ navigation, route }: MapScreenProps) {
  const { user } = route.params;
  const { location } = useLocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  
  type LocationType = {
    coords: {
      latitude: number;
      longitude: number;
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    if (location) {
      setRefreshing(true);
      await fetchNearby(location.coords.latitude, location.coords.longitude);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    const loc = location as LocationType;
    if (loc?.coords) {
      fetchNearby(loc.coords.latitude, loc.coords.longitude);
    }
  }, [location]);

  async function fetchNearby(lat: number, lng: number) {
    try {
      if (!lat || !lng) return;
      
      setIsLoading(true);
      setError(null);
      
      // Busca farmácias em um raio aproximado
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .gte('latitude', lat - 0.1)
        .lte('latitude', lat + 0.1)
        .gte('longitude', lng - 0.1)
        .lte('longitude', lng + 0.1)
        .limit(50);

      if (error) throw new Error(error.message);
      if (data) {
        // Filtra e ordena por distância
        const pharmaciesWithDistance = data
          .map(p => ({
            ...p,
            distance: getDistance(lat, lng, Number(p.latitude), Number(p.longitude))
          }))
          .filter(p => p.distance <= 5) // Mostra apenas farmácias em um raio de 5km
          .sort((a, b) => a.distance - b.distance);

        setPharmacies(pharmaciesWithDistance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar farmácias');
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpen = (pharmacy: Pharmacy) => {
    navigation.navigate('Checkin', { pharmacy, user });
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (location as LocationType).coords.latitude,
              longitude: (location as LocationType).coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            provider={PROVIDER_DEFAULT}
          >
            {/* Marcador da localização atual */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Sua localização"
              pinColor="blue"
            />
            {/* Círculo de raio de busca */}
            <Circle
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={5000} // 5km em metros
              fillColor="rgba(0, 0, 255, 0.1)"
              strokeColor="rgba(0, 0, 255, 0.3)"
            />
            {pharmacies.map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: Number(p.latitude) || 0, longitude: Number(p.longitude) || 0 }}
                title={p.name}
                description={p.address}
                onCalloutPress={() => handleOpen(p)}
              />
            ))}
          </MapView>
          <View style={styles.pharmacyList}>
            <FlatList
              horizontal
              data={pharmacies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.pharmacyCard}>
                  <Text style={styles.pharmacyName}>{item.name}</Text>
                  <Text>{item.distance?.toFixed(1)} km</Text>
                  <Button title="Check-in" onPress={() => handleOpen(item)} />
                </View>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2196F3']}
                />
              }
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{isLoading ? 'Carregando...' : 'Solicitando permissão de localização...'}</Text>
          {error && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: 'red' }}>{error}</Text>
              <Button
                title="Tentar novamente"
                onPress={() => {
                  if (location?.coords) {
                    fetchNearby(location.coords.latitude, location.coords.longitude);
                  }
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  pharmacyList: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  pharmacyCard: {
    backgroundColor: 'white',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
