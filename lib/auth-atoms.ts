import { atom } from "jotai";
import type { SignInResponse } from "./types";

export interface UserData {
  access_token: string;
  wallet_address: string;
  network: string;
}

// Helper functions for localStorage
const getUserFromStorage = (): UserData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('cavos-user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveUserToStorage = (user: UserData | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem('cavos-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cavos-user');
    }
  } catch {
    // Handle storage errors silently
  }
};

export const userAtom = atom<UserData | null>(getUserFromStorage());

export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

export const signInAtom = atom(null, (get, set, signInResponse: SignInResponse) => {
  if (signInResponse.success) {
    const userData: UserData = {
      access_token: signInResponse.access_token,
      wallet_address: signInResponse.wallet_address,
      network: signInResponse.network,
    };
    set(userAtom, userData);
    saveUserToStorage(userData);
  }
});

export const signOutAtom = atom(null, (get, set) => {
  set(userAtom, null);
  saveUserToStorage(null);
});