import { create } from "zustand";

import {
  loadCampName,
  loadCenterCode,
  saveCampName,
  saveCenterCode,
} from "@/lib/settings-storage";

type SettingsStore = {
  hydrated: boolean;
  centerCode: string;
  campName: string;
  hydrate: () => Promise<void>;
  setCentroAcopioCredentials: (code: string, name?: string) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  hydrated: false,
  centerCode: "",
  campName: "",

  hydrate: async () => {
    const [storedCode, storedName] = await Promise.all([
      loadCenterCode(),
      loadCampName(),
    ]);
    set({
      centerCode: storedCode ?? "",
      campName: storedName ?? "",
      hydrated: true,
    });
  },

  setCentroAcopioCredentials: async (code: string, name: string = "") => {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    
    set({ 
      centerCode: trimmedCode,
      campName: trimmedName
    });
    
    await Promise.all([
      saveCenterCode(trimmedCode),
      saveCampName(trimmedName)
    ]);
  },
}));
