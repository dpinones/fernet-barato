"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import LandingPage from "../components/LandingPage";
import LoginForm from "../components/LoginForm";
import AdminPanel from "../components/AdminPanel";
import ReportModal from "../components/ReportModal";
import { userAtom, isAuthenticatedAtom, signInAtom, signOutAtom } from "../lib/auth-atoms";
import { getAllStoresWithPrices, giveThanks, priceToDisplay, isAdmin, getPreviewStores } from "../lib/contract";
import type { SignInResponse, FilterOptions } from "../lib/types";

export default function Home() {
  const user = useAtomValue(userAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const signIn = useSetAtom(signInAtom);
  const signOut = useSetAtom(signOutAtom);

  type StoreWithDisplayData = {
    id: string;
    name: string;
    address: string;
    hours: string;
    URI: string;
    current_price: { price: string; timestamp: number };
    thanks_count: number;
    reports: Array<{ description: string; submitted_at: number; submitted_by: string }>;
    price_display: { store_id: string; price_in_cents: number; timestamp: number; formatted_price: string };
    price_difference_from_cheapest: number;
    price_difference_percentage: number;
    distance?: number; // Distance in kilometers
    coordinates?: { lat: number; lng: number };
  };

  const [rawStores, setRawStores] = useState<StoreWithDisplayData[]>([]);
  const [stores, setStores] = useState<StoreWithDisplayData[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreWithDisplayData | null>(null);
  const [filter, setFilter] = useState<FilterOptions>({ sortBy: 'price' });
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLanding, setShowLanding] = useState(!isAuthenticated);
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [previewStores, setPreviewStores] = useState<Array<{store: { id: string; name: string; address: string; hours: string; URI: string; }, price: { store_id: string; price_in_cents: number; timestamp: number; formatted_price: string; }}>>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Function to detect if device is mobile
  const detectMobile = useCallback(() => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileDevice || isMobileScreen;
  }, []);

  // Check if device is mobile on mount
  useEffect(() => {
    setIsMobile(detectMobile());
    
    const handleResize = () => {
      setIsMobile(detectMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectMobile]);

  // Function to calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }, []);

  // Function to get coordinates from address using a geocoding service
  const getCoordinatesFromAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Using a free geocoding service (Nominatim from OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Argentina')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }, []);

  // Function to get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setMessage('La geolocalización no está soportada en este navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
        console.log('User location obtained:', { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            const isIPhone = /iPhone/.test(navigator.userAgent);
            if (isIPhone) {
              setMessage('Las distancias no se mostrarán. Para activar la localización en tu navegador, abre la app Configuración en tu iPhone, ve a Privacidad y seguridad > Localización, busca tu navegador en la lista de apps y selecciona "Al usar la app".');
              setTimeout(() => setMessage(''), 12000);
            } else {
              setMessage('Permiso de ubicación denegado. Las distancias no se mostrarán.');
              setTimeout(() => setMessage(''), 5000);
            }
            break;
          case error.POSITION_UNAVAILABLE:
            setMessage('Ubicación no disponible. Las distancias no se mostrarán.');
            setTimeout(() => setMessage(''), 5000);
            break;
          case error.TIMEOUT:
            setMessage('Tiempo de espera agotado para obtener ubicación.');
            setTimeout(() => setMessage(''), 5000);
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Function to sort stores based on filter
  const sortStores = useCallback((storesToSort: StoreWithDisplayData[], sortBy: 'price' | 'distance') => {
    return [...storesToSort].sort((a, b) => {
      if (sortBy === 'price') {
        return a.price_display.price_in_cents - b.price_display.price_in_cents;
      }
      // Sort by distance (closest first)
      if (sortBy === 'distance') {
        const distanceA = a.distance ?? 999;
        const distanceB = b.distance ?? 999;
        return distanceA - distanceB;
      }
      return 0;
    });
  }, []);

  const checkAdminStatus = useCallback(async () => {
    if (!user?.access_token) {
      setIsUserAdmin(false);
      return;
    }

    try {
      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };
      
      const adminStatus = await isAdmin(contractParams);
      console.log('Admin status for user:', user.wallet_address, adminStatus);
      setIsUserAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsUserAdmin(false);
    }
  }, [user?.access_token, user?.wallet_address]);

  const loadPreviewStores = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const network = process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia';
      const preview = await getPreviewStores(network);
      console.log('Loaded preview stores:', preview);
      setPreviewStores(preview);
    } catch (error) {
      console.error('Error loading preview stores:', error);
      setPreviewStores([]);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const loadStores = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user?.access_token) {
        setMessage('Usuario no autenticado');
        setRawStores([]);
        setStores([]);
        return;
      }

      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };
      
      const storesData = await getAllStoresWithPrices(contractParams);
      console.log('Loaded stores from contract:', storesData);

      // Convert prices to display format and calculate price differences
      const storesWithPriceDisplay = storesData.map(store => {
        const priceDisplay = priceToDisplay(store.current_price, store.id);
        return {
          ...store,
          price_display: priceDisplay
        };
      });

      // Calculate price differences
      const prices = storesWithPriceDisplay.map(s => s.price_display.price_in_cents);
      const cheapestPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      const storesWithDifferences = storesWithPriceDisplay.map(store => ({
        ...store,
        price_difference_from_cheapest: store.price_display.price_in_cents - cheapestPrice,
        price_difference_percentage: cheapestPrice > 0 
          ? ((store.price_display.price_in_cents - cheapestPrice) / cheapestPrice) * 100 
          : 0
      }));
      
      // Calculate distances if user location is available
      let storesWithDistances = storesWithDifferences;
      if (userLocation) {
        console.log('Calculating distances from user location:', userLocation);
        storesWithDistances = await Promise.all(
          storesWithDifferences.map(async (store) => {
            try {
              // Get coordinates for the store address
              const coordinates = await getCoordinatesFromAddress(store.address);
              if (coordinates && userLocation) {
                const distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  coordinates.lat,
                  coordinates.lng
                );
                return {
                  ...store,
                  coordinates,
                  distance
                };
              }
              return store;
            } catch (error) {
              console.error('Error calculating distance for store:', store.name, error);
              return store;
            }
          })
        );
      }

      // Store raw data - filtering will be handled by the filter effect
      setRawStores(storesWithDistances);
    } catch (error) {
      console.error('Error loading stores:', error);
      setMessage('Error al cargar las tiendas desde el contrato');
      setRawStores([]);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.access_token, user?.wallet_address, userLocation, getCoordinatesFromAddress, calculateDistance]);

  // Handle filter changes without reloading data
  useEffect(() => {
    if (rawStores.length > 0) {
      const sortedStores = sortStores(rawStores, filter.sortBy);
      setStores(sortedStores);
    }
  }, [filter.sortBy, rawStores, sortStores]);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.access_token) {
      setShowLanding(false);
      checkAdminStatus();
      loadStores();
    } else {
      setShowLanding(true);
      setIsUserAdmin(false);
    }
  }, [isAuthenticated, user?.access_token, checkAdminStatus, loadStores]);

  // Load preview stores on app start
  useEffect(() => {
    loadPreviewStores();
  }, [loadPreviewStores]);

  // Request user location when authenticated
  useEffect(() => {
    if (isAuthenticated && !userLocation && locationPermission !== 'denied') {
      getUserLocation();
    }
  }, [isAuthenticated, userLocation, locationPermission, getUserLocation]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const formatPrice = (priceInCents: number) => {
    return `$${Math.round(priceInCents / 100).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-AR');
  };

  const formatTimestampRelative = (timestamp: number) => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const isOld = timestamp * 1000 < weekAgo;
    return isOld ? "Actualizado hace > 1 semana" : "Actualizado hace < 1 semana";
  };

  const isOldPrice = (timestamp: number) => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return timestamp * 1000 < weekAgo;
  };

  const handleGiveThanks = async (storeId: string) => {
    if (!user?.access_token) return;
    
    try {
      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };

      // Call the contract's give_thanks function
      await giveThanks(contractParams, storeId);
      setMessage('¡Gracias enviado exitosamente!');
      
      // Update local state immediately for better UX
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, thanks_count: store.thanks_count + 1 }
          : store
      ));
      
      // Refresh data from contract after a delay
      setTimeout(() => {
        loadStores();
      }, 2000);
      
    } catch (error) {
      console.error('Error giving thanks:', error);
      setMessage('Error al enviar gracias. Intente nuevamente.');
    }
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleSignIn = (signInResponse: SignInResponse) => {
    signIn(signInResponse);
    setShowLanding(false);
  };

  const handleSignOut = () => {
    signOut();
    setSelectedStore(null);
    setShowAdminPanel(false);
    setShowLanding(true);
    setMessage("");
    setIsUserAdmin(false);
    setShowUserMenu(false);
  };

  // Show desktop message if not mobile
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/titulo.png"
                alt="Fernet Barato"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="text-6xl mb-4">📱</div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Aplicación solo para móviles
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Esta aplicación está diseñada exclusivamente para dispositivos móviles. 
            Para una mejor experiencia, accede desde tu teléfono o tablet.
          </p>
        </div>
      </div>
    );
  }

  // Show landing page only if not authenticated and landing is active
  if (showLanding && !isAuthenticated) {
    return (
      <LandingPage 
        onGetStarted={handleGetStarted} 
        previewStores={previewStores}
        loadingPreview={loadingPreview}
      />
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm onSignIn={handleSignIn} />
          
          {/* Back to landing button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowLanding(true);
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedStore(null)}
                className="text-blue-600 text-sm font-medium"
              >
                ← Volver
              </button>
              <h1 className="text-lg font-semibold">Detalles de Tienda</h1>
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-600 text-lg">⋮</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg whitespace-nowrap z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>🚪</span>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Details */}
        <div className="flex justify-center">
          <div className="max-w-md p-4 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedStore.name}</h2>
              {selectedStore.reports.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  ⚠️ Reportado
                </span>
              )}
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">📍 Dirección:</span>
                <a
                  href={`https://maps.app.goo.gl/${selectedStore.URI}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-medium text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors mt-1"
                >
                  {selectedStore.address} 📍 
                </a>
              </div>
              <div>
                <span className="text-gray-600">🕒 Horarios:</span>
                <p className="font-medium">{selectedStore.hours}</p>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">Precio Actual</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-green-600">
                {selectedStore.price_display?.formatted_price || formatPrice(selectedStore.price_display?.price_in_cents || 0)}
              </span>
              {selectedStore.price_difference_from_cheapest! > 0 && (
                <span className="text-red-600 text-sm">
                  +{formatPrice(selectedStore.price_difference_from_cheapest!)} 
                  ({selectedStore.price_difference_percentage!.toFixed(1)}%)
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Actualizado: {formatTimestamp(selectedStore.current_price.timestamp)}</span>
              {isOldPrice(selectedStore.current_price.timestamp) && (
                <span className="text-yellow-600">⚠️</span>
              )}
            </div>
          </div>

          {/* Thanks Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Agradecimientos</h3>
                <p className="text-sm text-gray-600">{selectedStore.thanks_count} personas agradecieron</p>
              </div>
              <button
                onClick={() => handleGiveThanks(selectedStore.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                👍 Dar Gracias
              </button>
            </div>
          </div>

          {/* Report Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">¿Hay algún problema?</h3>
                <p className="text-sm text-gray-600">
                  {selectedStore.reports.length > 0 
                    ? `${selectedStore.reports.length} reporte(s) registrado(s)`
                    : 'Ayúdanos a mantener la información actualizada'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                ⚠️ Reportar
              </button>
            </div>
            
            {selectedStore.reports.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Último reporte: {selectedStore.reports[0]?.description}
                </p>
              </div>
            )}
          </div>

          {message && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded border border-yellow-200 text-sm">
              {message}
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-8 relative">
          
          {/* 3-dots menu - positioned absolute in top right */}
          <div className="absolute top-4 right-4 user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-600 text-lg">⋮</span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg whitespace-nowrap z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main header content - centered */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/titulo.png"
                alt="Fernet Barato"
                width={240}
                height={72}
                className="h-16 w-auto"
              />
              <Image
                src="/FernetBarato.png"
                alt="Fernet Barato"
                width={50}
                height={78}
                className="w-12 h-auto"
              />
            </div>
            <p className="text-base text-gray-600">Los mejores precios cerca tuyo</p>
          </div>

          {/* Sort Filters */}
          <div className="flex gap-2">
            Filtrar por: 
            <button
              onClick={() => setFilter({ ...filter, sortBy: 'price' })}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter.sortBy === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Precio
            </button>
            <button
              onClick={() => setFilter({ ...filter, sortBy: 'distance' })}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter.sortBy === 'distance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Distancia
            </button>
          </div>
        </div>
      </div>

      {/* Store List */}
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-lg font-semibold mb-4">Resultados</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando precios...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store, index) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      {index === 0 && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ⭐ MEJOR PRECIO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {store.price_display?.formatted_price || formatPrice(store.price_display?.price_in_cents || 0)}
                    </div>
                    {store.price_difference_from_cheapest! > 0 && (
                      <div className="text-xs text-red-600">
                        +{formatPrice(store.price_difference_from_cheapest!)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  {filter.sortBy === 'price' ? (
                    <>
                      <span className="flex items-center gap-1">
                        {store.thanks_count > 0 && `👍 ${store.thanks_count}`}
                        {store.thanks_count > 0 && " • "}
                        <span 
                          title={formatTimestamp(store.current_price.timestamp)}
                          className="cursor-help"
                        >
                          {formatTimestampRelative(store.current_price.timestamp)}
                        </span>
                        {isOldPrice(store.current_price.timestamp) && (
                          <span className="text-yellow-600">⚠️</span>
                        )}
                      </span>
                      <span>
                        {store.distance ? `${store.distance}km` : 'Calculando...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1">
                        {store.thanks_count > 0 && `👍 ${store.thanks_count}`}
                        {store.thanks_count > 0 && " • "}
                        <span 
                          title={formatTimestamp(store.current_price.timestamp)}
                          className="cursor-help"
                        >
                          {formatTimestampRelative(store.current_price.timestamp)}
                        </span>
                        {isOldPrice(store.current_price.timestamp) && (
                          <span className="text-yellow-600">⚠️</span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {store.distance ? `${store.distance}km` : 'Calculando...'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Panel Toggle - Only show for admins */}
      {user && isUserAdmin && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700"
          >
            ⚙️
          </button>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          stores={stores}
          onClose={() => setShowAdminPanel(false)}
          onUpdate={() => {
            setMessage('');
            loadStores();
          }}
        />
      )}

      {message && (
        <div className="fixed bottom-20 left-4 right-4">
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded border border-yellow-200 text-sm max-w-md mx-auto">
            {message}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedStore && (
        <ReportModal
          store={selectedStore}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={() => {
            setMessage('Reporte enviado exitosamente');
            loadStores();
          }}
        />
      )}
    </div>
  );
}
