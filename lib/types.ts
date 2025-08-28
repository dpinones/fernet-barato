export interface SignInResponse {
  success: boolean;
  access_token: string;
  wallet_address: string;
  network: string;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    wallet_address: string;
    created_at: string;
  };
}

export interface ContractExecutionResult {
  success: boolean;
  message: string;
  data?: {
    txHash?: string;
    [key: string]: unknown;
  };
}

// Fernet Barato specific types (matching contract structs)
export interface Store {
  id: string;
  name: string;
  address: string;
  hours: string;
  URI: string;
  current_price: Price;
}

export interface Price {
  price: string; // u256 as string
  timestamp: number; // u64
}

export interface Report {
  store_id: string;
  description: string;
  submitted_at: number;
  submitted_by: string;
}

export interface StoreWithPrice extends Store {
  thanks_count: number;
  reports: Report[];
  price_difference_from_cheapest?: number;
  price_difference_percentage?: number;
  distance?: number; // Distance in kilometers from user location
}

// Helper interface for displaying prices in frontend
export interface PriceDisplay {
  store_id: string;
  price_in_cents: number; // For display purposes, converted from u256
  timestamp: number;
  formatted_price: string; // e.g., "$18.90"
}

export interface FilterOptions {
  sortBy: 'price' | 'distance';
  showReported?: boolean;
}
