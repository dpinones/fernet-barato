import axios from 'axios';
import { Contract, RpcProvider, shortString, CallData, byteArray, cairo } from 'starknet';
import type { Store, Price, StoreWithPrice, Report, PriceDisplay } from './types';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract-config';

export interface ContractCallParams {
  walletAddress: string;
  network: string;
  accessToken: string;
}

// Helper function to get Starknet provider
function getStarknetProvider(network: string): RpcProvider {
  const rpcUrl = network === 'mainnet' 
    ? 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7'
    : 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  
  return new RpcProvider({ nodeUrl: rpcUrl });
}

// Helper function to get contract instance for view calls
function getContractForReading(network: string): Contract {
  const provider = getStarknetProvider(network);
  return new Contract(CONTRACT_ABI, CONTRACT_ADDRESS, provider);
}

// Helper function to convert ByteArray to string
function byteArrayToString(byteArray: unknown): string {
  if (!byteArray || typeof byteArray === 'string') {
    return (byteArray as string) || '';
  }
  
  try {
    // Handle different ByteArray formats
    const byteArrayObj = byteArray as { 
      data?: unknown[]; 
      pending_word?: string; 
      pending_word_len?: number;
      toString?: () => string;
    };
    
    if (byteArrayObj.data && Array.isArray(byteArrayObj.data)) {
      let result = '';
      for (const item of byteArrayObj.data) {
        result += shortString.decodeShortString(String(item));
      }
      if (byteArrayObj.pending_word && byteArrayObj.pending_word_len && byteArrayObj.pending_word_len > 0) {
        result += shortString.decodeShortString(byteArrayObj.pending_word).slice(0, byteArrayObj.pending_word_len);
      }
      return result;
    }
    
    return shortString.decodeShortString(String(byteArray));
  } catch (error) {
    console.warn('Error decoding ByteArray:', error);
    return String(byteArray) || '';
  }
}

// Helper function to convert u256 to number (price in cents)
function u256ToNumber(u256Value: unknown): number {
  try {
    console.log('Converting u256 value:', u256Value, 'type:', typeof u256Value);
    
    // Handle null/undefined
    if (u256Value === null || u256Value === undefined) {
      console.warn('u256 value is null/undefined');
      return 0;
    }
    
    // Handle string representation
    if (typeof u256Value === 'string') {
      const parsed = parseInt(u256Value, 10);
      if (isNaN(parsed)) {
        console.warn('Failed to parse string u256:', u256Value);
        return 0;
      }
      return parsed;
    }
    
    // Handle direct number
    if (typeof u256Value === 'number') {
      if (isNaN(u256Value)) {
        console.warn('u256 value is NaN:', u256Value);
        return 0;
      }
      return u256Value;
    }
    
    // Handle BigInt
    if (typeof u256Value === 'bigint') {
      return Number(u256Value);
    }
    
    // Handle object formats from Starknet
    if (u256Value && typeof u256Value === 'object') {
      const u256Obj = u256Value as { low?: unknown; high?: unknown } | unknown[];
      
      // Handle { low: number, high: number } format
      if ('low' in u256Obj && 'high' in u256Obj) {
        const low = Number(u256Obj.low);
        const high = Number(u256Obj.high);
        if (high === 0) {
          return low; // Most prices will fit in low part
        }
        return low + (high * Math.pow(2, 128));
      }
      
      // Handle array format [low, high]
      if (Array.isArray(u256Obj) && u256Obj.length === 2) {
        const low = Number(u256Obj[0]);
        const high = Number(u256Obj[1]);
        if (high === 0) {
          return low;
        }
        return low + (high * Math.pow(2, 128));
      }
    }
    
    // Last resort: convert to string and parse
    const stringValue = String(u256Value);
    const parsed = parseInt(stringValue, 10);
    if (isNaN(parsed)) {
      console.warn('Failed to convert u256 to number:', u256Value);
      return 0;
    }
    return parsed;
  } catch (error) {
    console.error('Error converting u256 to number:', error, 'value:', u256Value);
    return 0;
  }
}



// Function to execute contract calls through Cavos
async function executeContractCall(
  params: ContractCallParams,
  contractAddress: string,
  entrypoint: string,
  calldata: string[] = []
) {
  try {
    const response = await axios.post("/api/v1/execute", {
      walletAddress: params.walletAddress,
      network: params.network,
      accessToken: params.accessToken,
      calls: [
        {
          contractAddress,
          entrypoint,
          calldata,
        },
      ],
    });

    return response.data;
  } catch (error) {
    console.error(`Error calling ${entrypoint}:`, error);
    throw error;
  }
}

// Contract read functions using real Starknet integration
export async function getAllStores(params: ContractCallParams): Promise<Store[]> {
  try {
    console.log('Calling get_all_stores with network:', params.network);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_all_stores');
    console.log('Raw contract result for get_all_stores:', result);
    
    // Convert contract result to Store array
    const stores: Store[] = [];
    if (Array.isArray(result)) {
      for (const storeData of result) {
        const store = storeData as {
          id: { toString(): string };
          name: unknown;
          address: unknown;
          hours: unknown;
          URI: unknown;
          current_price: {
            price: unknown;
            timestamp: { toString(): string };
          };
        };
        stores.push({
          id: store.id.toString(),
          name: byteArrayToString(store.name),
          address: byteArrayToString(store.address),
          hours: byteArrayToString(store.hours),
          URI: byteArrayToString(store.URI),
          current_price: {
            price: u256ToNumber(store.current_price.price).toString(),
            timestamp: Number(store.current_price.timestamp.toString())
          }
        });
      }
    }
    
    return stores;
  } catch (error) {
    console.error('Error getting all stores:', error);
    throw error;
  }
}

export async function getAllCurrentPrices(params: ContractCallParams): Promise<Array<{store_id: string, price: Price}>> {
  try {
    console.log('Calling get_all_current_prices with network:', params.network);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_all_current_prices');
    console.log('Raw contract result for get_all_current_prices:', result, 'type:', typeof result);
    
    // Convert contract result to price array
    const prices: Array<{store_id: string, price: Price}> = [];
    
    // Handle different possible result formats
    if (Array.isArray(result)) {
      console.log('Result is array with length:', result.length);
      for (let i = 0; i < result.length; i++) {
        try {
          const priceData = result[i];
          console.log(`Processing item ${i}:`, priceData, 'type:', typeof priceData, 'isArray:', Array.isArray(priceData));
          
          // Check if priceData is iterable and has expected structure
          if (Array.isArray(priceData) && priceData.length >= 2) {
            const [storeId, priceInfo] = priceData as [
              { toString(): string },
              { price: { toString(): string }; timestamp: number }
            ];
            prices.push({
              store_id: storeId.toString(),
              price: {
                price: priceInfo.price.toString(),
                timestamp: Number(priceInfo.timestamp)
              }
            });
          } else {
            console.warn(`Unexpected priceData format at index ${i}:`, priceData);
          }
        } catch (itemError) {
          console.error(`Error processing price item ${i}:`, itemError, 'item:', result[i]);
          continue; // Skip this item and continue with others
        }
      }
    } else {
      console.warn('getAllCurrentPrices result is not an array:', result);
    }
    
    console.log('Processed prices:', prices.length, 'items');
    return prices;
  } catch (error) {
    console.error('Error getting current prices:', error);
    throw error;
  }
}

export async function getStore(params: ContractCallParams, storeId: string): Promise<Store> {
  try {
    console.log('Calling get_store with network:', params.network, 'storeId:', storeId);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_store', [storeId]);
    console.log('Raw contract result for get_store:', result);
    
    const store = result as {
      id: { toString(): string };
      name: unknown;
      address: unknown;
      hours: unknown;
      URI: unknown;
      current_price: {
        price: unknown;
        timestamp: { toString(): string };
      };
    };
    
    return {
      id: store.id.toString(),
      name: byteArrayToString(store.name),
      address: byteArrayToString(store.address),
      hours: byteArrayToString(store.hours),
      URI: byteArrayToString(store.URI),
      current_price: {
        price: u256ToNumber(store.current_price.price).toString(),
        timestamp: Number(store.current_price.timestamp.toString())
      }
    };
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
}

// export async function getCurrentPrice(params: ContractCallParams, storeId: string): Promise<Price> {
//   try {
//     console.log('Calling get_current_price with network:', params.network, 'storeId:', storeId);
//     const contract = getContractForReading(params.network);
    
//     const result = await contract.call('get_current_price', [storeId]);
//     console.log('Raw contract result for get_current_price:', result);
    
//     const price = result as {
//       price: { toString(): string };
//       timestamp: number;
//     };
    
//     return {
//       price: price.price.toString(),
//       timestamp: Number(price.timestamp)
//     };
//   } catch (error) {
//     console.error('Error getting current price:', error);
//     throw error;
//   }
// }

export async function getPriceHistory(params: ContractCallParams, storeId: string): Promise<Price[]> {
  try {
    console.log('Calling get_price_history with network:', params.network, 'storeId:', storeId);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_price_history', [storeId]);
    console.log('Raw contract result for get_price_history:', result);
    
    const prices: Price[] = [];
    if (Array.isArray(result)) {
      for (const priceData of result) {
        const price = priceData as {
          price: { toString(): string };
          timestamp: number;
        };
        prices.push({
          price: price.price.toString(),
          timestamp: Number(price.timestamp)
        });
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Error getting price history:', error);
    throw error;
  }
}

export async function getThanksCount(params: ContractCallParams, storeId: string): Promise<number> {
  try {
    console.log('Calling get_thanks_count with network:', params.network, 'storeId:', storeId);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_thanks_count', [storeId]);
    console.log('Raw contract result for get_thanks_count:', result);
    
    return Number(result);
  } catch (error) {
    console.error('Error getting thanks count:', error);
    throw error;
  }
}

export async function hasUserThanked(params: ContractCallParams, storeId: string): Promise<boolean> {
  try {
    console.log('Calling has_user_thanked with network:', params.network, 'storeId:', storeId);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('has_user_thanked', [storeId, params.walletAddress]);
    console.log('Raw contract result for has_user_thanked:', result);
    
    // Handle boolean result from contract
    const boolResult = result as boolean | number | { toString(): string };
    return boolResult === true || boolResult === 1 || String(boolResult) === '1';
  } catch (error) {
    console.error('Error checking if user thanked:', error);
    throw error;
  }
}

export async function getReports(params: ContractCallParams, storeId: string): Promise<Report[]> {
  try {
    console.log('Calling get_reports with network:', params.network, 'storeId:', storeId);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('get_reports', [storeId]);
    console.log('Raw contract result for get_reports:', result);
    
    const reports: Report[] = [];
    if (Array.isArray(result)) {
      for (const reportData of result) {
        const report = reportData as {
          store_id: { toString(): string };
          description: unknown;
          submitted_at: number;
          submitted_by: { toString(): string };
        };
        reports.push({
          store_id: report.store_id.toString(),
          description: byteArrayToString(report.description),
          submitted_at: Number(report.submitted_at),
          submitted_by: report.submitted_by.toString()
        });
      }
    }
    
    return reports;
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
}

export async function isAdmin(params: ContractCallParams): Promise<boolean> {
  try {
    console.log('Calling is_admin with network:', params.network, 'walletAddress:', params.walletAddress);
    const contract = getContractForReading(params.network);
    
    const result = await contract.call('is_admin', [params.walletAddress]);
    console.log('Raw contract result for is_admin:', result);
    
    // Handle boolean result from contract
    const boolResult = result as boolean | number | { toString(): string };
    return boolResult === true || boolResult === 1 || String(boolResult) === '1';
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return false; // Default to false if there's an error
  }
}

// Contract write functions
export async function giveThanks(params: ContractCallParams, storeId: string) {
  try {
    
    // Use CallData.compile to properly format the parameters
    const calldata = CallData.compile([storeId]);
    
    const result = await executeContractCall(
      params,
      CONTRACT_ADDRESS,
      "give_thanks",
      calldata
    );
    
    console.log('Thanks given successfully:', result);
    return result;
  } catch (error) {
    console.error('Error giving thanks:', error);
    throw error;
  }
}

export async function submitReport(params: ContractCallParams, storeId: string, description: string) {
  try {
    
    // Use CallData.compile with byteArrayFromString as per Starknet.js documentation
    const calldata = CallData.compile([
      storeId, 
      byteArray.byteArrayFromString(description)
    ]);
    
    const result = await executeContractCall(
      params,
      CONTRACT_ADDRESS,
      "submit_report",
      calldata
    );
    
    console.log('Report submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

export async function updatePrice(
  params: ContractCallParams,
  storeId: string,
  priceInCents: number
) {
  try {
    console.log('Updating price:', { storeId, priceInCents });
    
    // Convert price to proper u256 format using cairo.uint256
    const priceU256 = cairo.uint256(priceInCents);
    
    console.log('Price as cairo.uint256:', priceU256);
    
    // Use CallData.compile with the properly formatted u256
    const calldata = CallData.compile([
      storeId,
      priceU256
    ]);
    
    console.log('Compiled calldata for updatePrice:', calldata);
    
    const result = await executeContractCall(
      params,
      CONTRACT_ADDRESS,
      "update_price",
      calldata
    );
    
    console.log('Price updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating price with cairo.uint256:', error);
    
    // Fallback: try with simple number
    try {
      console.log('Retrying with simple number format...');
      const calldata = CallData.compile([storeId, priceInCents]);
      
      const result = await executeContractCall(
        params,
        CONTRACT_ADDRESS,
        "update_price",
        calldata
      );
      
      console.log('Price updated successfully with fallback:', result);
      return result;
    } catch (fallbackError) {
      console.error('Both attempts failed:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function addStore(
  params: ContractCallParams,
  store: Omit<Store, 'id' | 'current_price'>
) {
  try {
    
    // Use CallData.compile with byteArrayFromString as per Starknet.js documentation
    const calldata = CallData.compile([
      byteArray.byteArrayFromString(store.name),
      byteArray.byteArrayFromString(store.address),
      byteArray.byteArrayFromString(store.hours),
      byteArray.byteArrayFromString(store.URI)
    ]);
    
    
    const result = await executeContractCall(
      params,
      CONTRACT_ADDRESS,
      "add_store",
      calldata
    );
    
    console.log('Store added successfully:', result);
    return result;
  } catch (error) {
    console.error('Error adding store:', error);
    throw error;
  }
}

// Helper function to format price without decimals and with thousands separators
function formatPriceForDisplay(priceInCents: number): string {
  return `$${Math.round(priceInCents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

// Helper function to convert Price to PriceDisplay for frontend
export function priceToDisplay(price: Price, storeId: string): PriceDisplay {
  console.log('priceToDisplay input:', { price, storeId });
  const priceInCents = u256ToNumber(price.price);
  const formattedPrice = formatPriceForDisplay(priceInCents);
  console.log('priceToDisplay converted:', { priceInCents, formatted: formattedPrice });
  
  return {
    store_id: storeId,
    price_in_cents: priceInCents,
    timestamp: price.timestamp,
    formatted_price: formattedPrice
  };
}

// Helper function to get complete store data with prices and metadata
export async function getStoreWithPrice(params: ContractCallParams, storeId: string): Promise<StoreWithPrice> {
  try {
    const [store, thanksCount, reports] = await Promise.all([
      getStore(params, storeId),
      getThanksCount(params, storeId),
      getReports(params, storeId)
    ]);

    return {
      ...store,
      thanks_count: thanksCount,
      reports
    };
  } catch (error) {
    console.error('Error getting store with price:', error);
    throw error;
  }
}

// Helper function to get all stores with their complete data
export async function getAllStoresWithPrices(params: ContractCallParams): Promise<StoreWithPrice[]> {
  try {
    const stores = await getAllStores(params);
    
    // Get complete data for each store
    const storesWithPrices = await Promise.all(
      stores.map(store => getStoreWithPrice(params, store.id))
    );

    return storesWithPrices;
  } catch (error) {
    console.error('Error getting all stores with prices:', error);
    throw error;
  }
}

// Helper function to get stores with current prices using the optimized contract method
export async function getAllStoresWithCurrentPrices(params: ContractCallParams): Promise<Array<{store: Store, price: PriceDisplay}>> {
  try {
    const stores = await getAllStores(params);
    
    // Convert stores with their built-in current_price to the expected format
    const result: Array<{store: Store, price: PriceDisplay}> = stores.map(store => ({
      store,
      price: priceToDisplay(store.current_price, store.id)
    }));
    
    return result;
  } catch (error) {
    console.error('Error getting all stores with current prices:', error);
    throw error;
  }
}

// Function to get preview stores with real prices (fallback to mock if needed)
export async function getPreviewStores(network: string = 'sepolia'): Promise<Array<{store: Store, price: PriceDisplay}>> {
  try {
    console.log('Getting preview stores for network:', network);
    
    // Create params for contract calls
    const mockParams: ContractCallParams = {
      walletAddress: '0x0', // Mock address since we're only reading
      network: network,
      accessToken: '' // Empty since we're only doing read operations
    };
    
    // Try to get real current prices from the contract
    try {
      const allCurrentPrices = await getAllCurrentPrices(mockParams);
      console.log('Preview - real current prices loaded:', allCurrentPrices.length);
      
      if (allCurrentPrices.length > 0) {
        // Sort by price to get the cheapest ones first
        const sortedPrices = allCurrentPrices
          .filter(item => item.price.price !== "0" && item.price.price !== "") // Filter out stores with no price
          .sort((a, b) => {
            const priceA = Number(a.price.price);
            const priceB = Number(b.price.price);
            return priceA - priceB;
          })
          .slice(0, 2); // Take the 2 cheapest stores
        
        const allStores = await getAllStores(mockParams);
        console.log('Preview - stores loaded:', allStores.length);
        
        // Create preview stores with real prices
        const previewStores: Array<{store: Store, price: PriceDisplay}> = [];
        
        for (const priceData of sortedPrices) {
          const store = allStores.find(s => s.id === priceData.store_id);
          if (store) {
            const priceDisplay = priceToDisplay(priceData.price, priceData.store_id);
            previewStores.push({
              store,
              price: priceDisplay
            });
          }
        }
        
        console.log('Preview stores with real prices:', previewStores);
        return previewStores;
      }
    } catch (priceError) {
      console.warn('Could not get real prices for preview, using fallback:', priceError);
    }
    
    // Fallback: Get stores and use realistic mock prices (around $15,000)
    const stores = await getAllStores(mockParams);
    console.log('Preview stores loaded (fallback):', stores.length);
    
    // Create stores with realistic mock prices for preview
    const storesWithRealisticPrices: Array<{store: Store, price: PriceDisplay}> = stores.slice(0, 2).map((store, index) => {
      // Realistic mock prices: around $15,000-$16,000
      const mockPriceInCents = index === 0 ? 1500000 : 1580000; // $15,000 vs $15,800
      return {
        store,
        price: {
          store_id: store.id,
          price_in_cents: mockPriceInCents,
          timestamp: Math.floor(Date.now() / 1000),
          formatted_price: `$${Math.round(mockPriceInCents / 100).toLocaleString('es-AR')}`
        }
      };
    });
    
    console.log('Preview stores with realistic mock prices:', storesWithRealisticPrices);
    return storesWithRealisticPrices;
  } catch (error) {
    console.error('Error getting preview stores:', error);
    return []; // Return empty array instead of throwing to avoid breaking the preview
  }
}
