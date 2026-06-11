/** MMKV-backed storage adapter for zustand persist (faster than AsyncStorage). */

import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkv = createMMKV({ id: 'pulse' });

export const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

export function wipeAllStorage(): void {
  mmkv.clearAll();
}
