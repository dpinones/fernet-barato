"use client";

import Image from "next/image";

interface LandingPageProps {
  onGetStarted: () => void;
  previewStores: Array<{store: { id: string; name: string; address: string; hours: string; URI: string; }, price: { store_id: string; price_in_cents: number; timestamp: number; formatted_price: string; }}>;
  loadingPreview: boolean;
}

export default function LandingPage({ onGetStarted, previewStores, loadingPreview }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Hero Section */}
        <div className="mb-8">
          {/* Main Logo/Icon */}
          <div className="mb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/FernetBarato.png"
                alt="Fernet Barato"
                width={120}
                height={187}
                className="w-24 h-auto"
              />
            </div>
            <div className="flex justify-center mb-4">
              <Image
                src="/titulo.png"
                alt="Fernet Barato"
                width={280}
                height={84}
                className="h-20 w-auto"
              />
            </div>
                    {/* Call to Action */}
            <div className="space-y-4">  
              <h1 className="text-lg font-semibold mb-4">
                ¡Encuentra el Fernet más barato cerca de ti! Inicia sesión para ver todos los precios, mapas
              </h1>
              <button
                onClick={onGetStarted}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:from-orange-700 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
            <h2 className="text-lg font-semibold mb-4">Los mejores precios hoy</h2>
            
            {loadingPreview ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Cargando precios...</p>
              </div>
            ) : previewStores.length > 0 ? (
              <div className="space-y-3">
                {previewStores.map((storeData, index) => (
                  <div
                    key={storeData.store.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{storeData.store.name}</h3>
                          {index === 0 && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              ⭐ MEJOR
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">{storeData.store.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {storeData.price.formatted_price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 text-sm">Cargando datos...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        {/* <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-xs text-gray-600">Gratuito</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-xs text-gray-600">Disponible</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">🔐</div>
              <div className="text-xs text-gray-600">Seguro</div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}