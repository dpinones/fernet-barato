"use client";

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '../lib/auth-atoms';
import { submitReport } from '../lib/contract';
interface ReportModalProps {
  store: {
    id: string;
    name: string;
    address: string;
  };
  onClose: () => void;
  onReportSubmitted: () => void;
}

export default function ReportModal({ store, onClose, onReportSubmitted }: ReportModalProps) {
  const user = useAtomValue(userAtom);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.access_token || !description.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const contractParams = {
        walletAddress: user.wallet_address,
        network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
        accessToken: user.access_token
      };

      await submitReport(contractParams, store.id, description.trim());
      setMessage('¡Reporte enviado exitosamente!');
      
      // Clear form and close modal after a delay
      setTimeout(() => {
        onReportSubmitted();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage('Error al enviar el reporte. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportTypes = [
    'Precio incorrecto',
    'Tienda cerrada',
    'Información desactualizada',
    'Sin stock de Fernet',
    'Datos de contacto incorrectos',
    'Otro'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Reportar Problema</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{store.name}</h4>
            <p className="text-sm text-gray-600">{store.address}</p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${
              message.includes('exitosamente')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué problema encontraste?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDescription(type)}
                    className={`text-sm p-2 rounded border text-left ${
                      description === type
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema en detalle..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={31}
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Tu reporte será registrado en la blockchain y será visible públicamente.
                    Los reportes ayudan a mantener la información actualizada.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
