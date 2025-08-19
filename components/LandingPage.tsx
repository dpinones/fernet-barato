"use client";

import Image from "next/image";

interface LandingPageProps {
  onGetStarted: () => void;
  previewStores: Array<{store: { id: string; name: string; address: string; hours: string; URI: string; }, price: { store_id: string; price_in_cents: number; timestamp: number; formatted_price: string; }}>;
  loadingPreview: boolean;
}

export default function LandingPage({ onGetStarted, previewStores, loadingPreview }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-fernet-light flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Hero Section */}
        <div className="mb-8">
          {/* Main Logo/Icon */}
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <Image
                src="/titulo.png"
                alt="Fernet Barato"
                width={400}
                height={120}
                className="w-[85%] h-auto"
              />
            </div>
            <div className="flex justify-center mb-2">
              <Image
                src="/FernetBarato.png"
                alt="Fernet Barato"
                width={120}
                height={180}
                className="w-22 h-auto"
              />
            </div>
                    {/* Call to Action */}
            <div className="space-y-4">  
              <h1 className="text-lg font-semibold mb-4 text-fernet-dark">
                ¡Encontra el Fernet más barato cerca tuyo! Logueate para ver todos los precios.
              </h1>
              <button
                onClick={onGetStarted}
                className="w-full bg-fernet-gold text-fernet-dark py-4 px-8 rounded-xl text-lg font-semibold hover:bg-yellow-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2 text-fernet-dark text-center">
              Hay {previewStores.length - 2 } precios mejores
            </h2>
            
            {loadingPreview ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fernet-gold mx-auto"></div>
              </div>
            ) : previewStores.length > 0 ? (
              <div className="space-y-4">
                {previewStores.map((storeData, index) => (
                  <div
                    key={storeData.store.id}
                    className="rounded-xl shadow-md border border-fernet-gold p-5 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-fernet-dark">{storeData.store.name}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-fernet-green">
                          💰 {storeData.price.formatted_price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-fernet-dark opacity-70 text-sm"></p>
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