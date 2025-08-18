import type { SignInResponse } from "./types";

export interface UserData {
  access_token: string;
  wallet_address: string;
  network?: string;
}

const USER_STORAGE_KEY = "cavos_user";

export const auth = {
  // Get user from localStorage
  getUser(): UserData | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Set user in localStorage
  setUser(signInResponse: SignInResponse): UserData {
    const userData: UserData = {
      access_token: signInResponse.access_token,
      wallet_address: signInResponse.wallet_address,
      network: "sepolia",
    };
    
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    }
    
    return userData;
  },

  // Remove user from localStorage
  clearUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const user = this.getUser();
    return user !== null && user.access_token !== "";
  },
};