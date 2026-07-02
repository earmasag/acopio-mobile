import { create } from "zustand";

import {
  loadCampName,
  loadCentroAcopioId,
  saveCampName,
  saveCentroAcopioId,
} from "@/lib/settings-storage";

type SettingsStore = {
  hydrated: boolean;
  centroAcopioId: string;
  campName: string;
  hydrate: () => Promise<void>;
  setCentroAcopioId: (id: string, name?: string) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  hydrated: false,
  centroAcopioId: "",
  campName: "",

  hydrate: async () => {
    const [storedId, storedName] = await Promise.all([
      loadCentroAcopioId(),
      loadCampName(),
    ]);
    set({
      centroAcopioId: storedId ?? "",
      campName: storedName ?? "",
      hydrated: true,
    });
  },

  setCentroAcopioId: async (id: string, name: string = "") => {
    const trimmedId = id.trim();
    const trimmedName = name.trim();
    
    set({ 
      centroAcopioId: trimmedId,
      campName: trimmedName
    });
    
    await Promise.all([
      saveCentroAcopioId(trimmedId),
      saveCampName(trimmedName)
    ]);
  },
}));
