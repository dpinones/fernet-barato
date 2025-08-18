"use client";

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '../lib/auth-atoms';
import { updatePrice, addStore } from '../lib/contract';

interface AdminPanelProps {
  stores: Array<{
    id: string;
    name: string;
    address: string;
    hours: string;
    URI: string;
    price_display?: { formatted_price: string };
  }>;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AdminPanel({ stores, onClose, onUpdate }: AdminPanelProps) {
  const user = useAtomValue(userAtom);
  const [activeTab, setActiveTab] = useState<'update' | 'add'>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Update price form state
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  // Add store form state
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    hours: '',
    URI: ''
  });

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.access_token || !selectedStoreId || !newPrice) return;

    setIsLoading(true);
    setMessage('');

    try {
      const priceInCents = Math.round(parseFloat(newPrice) * 100);
      
      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };

      await updatePrice(contractParams, selectedStoreId, priceInCents);
      
      setMessage('¡Precio actualizado exitosamente en la blockchain!');
      setNewPrice('');
      setSelectedStoreId('');
      
      // Refresh the stores data
      setTimeout(() => {
        onUpdate();
      }, 1000);

    } catch (error) {
      console.error('Error updating price:', error);
      setMessage('Error al actualizar el precio. Verifique los datos e intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.access_token || !newStore.name || !newStore.address) return;

    setIsLoading(true);
    setMessage('');

    try {
      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };

      await addStore(contractParams, newStore);
      
      setMessage('¡Tienda agregada exitosamente a la blockchain!');
      setNewStore({
        name: '',
        address: '',
        hours: '',
        URI: ''
      });
      
      // Refresh the stores data
      setTimeout(() => {
        onUpdate();
      }, 1000);

    } catch (error) {
      console.error('Error adding store:', error);
      setMessage('Error al agregar la tienda. Verifique los datos e intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePrice = (price: string) => {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0 && num < 100000; // Between 0 and $100,000
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Panel Administrativo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('update')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'update'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Actualizar Precios
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'add'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Agregar Tienda
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${
              message.includes('exitosamente')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {activeTab === 'update' && (
            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Tienda
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione una tienda...</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.price_display?.formatted_price || `$0.00`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Precio (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999.99"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="1750.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {newPrice && !validatePrice(newPrice) && (
                  <p className="text-red-600 text-xs mt-1">
                    Ingrese un precio válido entre $0.01 y $99,999.99
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !selectedStoreId || !newPrice || !validatePrice(newPrice)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Actualizando en Blockchain...' : 'Actualizar Precio'}
              </button>
            </form>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Tienda *
                </label>
                <input
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="Carrefour Villa Crespo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={31}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  placeholder="Av. Corrientes 4817, Villa Crespo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={31}
                  required
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horarios
                </label>
                <input
                  type="text"
                  value={newStore.hours}
                  onChange={(e) => setNewStore({ ...newStore, hours: e.target.value })}
                  placeholder="Lun-Dom: 8:00-22:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={31}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio Web
                </label>
                <input
                  type="text"
                  value={newStore.URI}
                  onChange={(e) => setNewStore({ ...newStore, URI: e.target.value })}
                  placeholder="HB4Hymkdh6NRnHy1A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={31}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !newStore.name || !newStore.address}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Agregando a Blockchain...' : 'Agregar Tienda'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
