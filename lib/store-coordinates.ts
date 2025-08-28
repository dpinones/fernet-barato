export interface StoreCoordinates {
  name: string;
  lat: number;
  lng: number;
}

export const STORE_COORDINATES: Record<string, StoreCoordinates> = {
  'Supermercado Enor': {
    name: 'Supermercado Enor',
    lat: -34.457228,
    lng: -58.9104137
  },
  'Supermercado Chino Familia': {
    name: 'Supermercado Chino Familia',
    lat: -34.4471295,
    lng: -58.8981354
  },
  'Super Tenta': {
    name: 'Super Tenta',
    lat: -34.4555109,
    lng: -58.9212648
  },
  'Supermercado Las Marias2': {
    name: 'Supermercado Las Marias2',
    lat: -34.4525611,
    lng: -58.8824968
  },
  'Las Marias Supermarket': {
    name: 'Las Marias Supermarket',
    lat: -34.4484204,
    lng: -58.8723886
  },
  'Autoservicio Mayorista Maxi 200': {
    name: 'Autoservicio Mayorista Maxi 200',
    lat: -34.5140811,
    lng: -58.7249649
  },
  'Supermercado Angel': {
    name: 'Supermercado Angel',
    lat: -34.4587466,
    lng: -58.9155361
  },
  'Autoservicio Fatima': {
    name: 'Autoservicio Fatima',
    lat: -34.4359189,
    lng: -58.9919568
  },
  'El Siglo': {
    name: 'El Siglo',
    lat: -34.4534259,
    lng: -58.929319
  },
  'Carrefour Hipermercado Pilar': {
    name: 'Carrefour Hipermercado Pilar',
    lat: -34.4573728,
    lng: -58.8987983
  },
  'Supermercados Eco': {
    name: 'Supermercados Eco',
    lat: -34.4563693,
    lng: -58.9143726
  },
  'Mercado del Parque': {
    name: 'Mercado del Parque',
    lat: -34.4129136,
    lng: -58.9687801
  },
  'Supermercado Hito Market': {
    name: 'Supermercado Hito Market',
    lat: -34.4566373,
    lng: -58.9156631
  },
  'Verduleria & Despensa Evelyn': {
    name: 'Verduleria & Despensa Evelyn',
    lat: -34.4437365,
    lng: -58.9756275
  }
};

export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

export function getStoreDistance(storeName: string, userLat: number, userLng: number): number | null {
  const storeCoords = STORE_COORDINATES[storeName];
  if (!storeCoords) {
    return null;
  }
  
  return calculateHaversineDistance(userLat, userLng, storeCoords.lat, storeCoords.lng);
}