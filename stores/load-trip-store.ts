import { create } from "zustand";

import {
  loadClosedTrips,
  loadInProgressTrips,
  saveClosedTrips,
  saveInProgressTrips,
} from "@/lib/load-trip-storage";
import {
  createLoadTrip,
  createLoadedBox,
  isValidPlate,
  type LoadTrip,
} from "@/types/load";

type LoadTripStore = {
  hydrated: boolean;
  inProgressTrips: LoadTrip[];
  closedTrips: LoadTrip[];
  focusedTripId: string | null;
  hydrate: () => Promise<void>;
  getTrip: (tripId: string) => LoadTrip | undefined;
  focusTrip: (tripId: string) => void;
  createTrip: (plate: string) => LoadTrip | null;
  addBox: (tripId: string, packageUuid: string) => boolean;
  removeBox: (tripId: string, boxId: string) => void;
  closeTrip: (tripId: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  markSynced: (tripId: string, syncedAt: string) => Promise<void>;
  markSyncError: (tripId: string, error: string) => Promise<void>;
};

function touch(trip: LoadTrip): LoadTrip {
  return { ...trip, updatedAt: new Date().toISOString() };
}

export const useLoadTripStore = create<LoadTripStore>((set, get) => ({
  hydrated: false,
  inProgressTrips: [],
  closedTrips: [],
  focusedTripId: null,

  hydrate: async () => {
    const [inProgressTrips, closedTrips] = await Promise.all([
      loadInProgressTrips(),
      loadClosedTrips(),
    ]);
    set({
      inProgressTrips,
      closedTrips,
      focusedTripId: inProgressTrips[0]?.id ?? null,
      hydrated: true,
    });
  },

  getTrip: (tripId) => {
    const { inProgressTrips, closedTrips } = get();
    return (
      inProgressTrips.find((trip) => trip.id === tripId) ??
      closedTrips.find((trip) => trip.id === tripId)
    );
  },

  focusTrip: (tripId) => {
    if (!get().getTrip(tripId)) return;
    set({ focusedTripId: tripId });
  },

  createTrip: (plate) => {
    if (!isValidPlate(plate)) return null;

    const trip = createLoadTrip(plate);
    const next = [trip, ...get().inProgressTrips];
    set({ inProgressTrips: next, focusedTripId: trip.id });
    void saveInProgressTrips(next);
    return trip;
  },

  addBox: (tripId, packageUuid) => {
    const { inProgressTrips } = get();
    const index = inProgressTrips.findIndex((trip) => trip.id === tripId);
    if (index === -1) return false;

    const trip = inProgressTrips[index];
    const normalized = packageUuid.trim();
    if (!normalized) return false;

    if (
      trip.boxes.some(
        (box) => box.packageUuid.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      return false;
    }

    const nextTrip = touch({
      ...trip,
      boxes: [...trip.boxes, createLoadedBox(normalized)],
    });
    const next = [...inProgressTrips];
    next[index] = nextTrip;
    set({ inProgressTrips: next, focusedTripId: tripId });
    void saveInProgressTrips(next);
    return true;
  },

  removeBox: (tripId, boxId) => {
    const { inProgressTrips } = get();
    const index = inProgressTrips.findIndex((trip) => trip.id === tripId);
    if (index === -1) return;

    const nextTrip = touch({
      ...inProgressTrips[index],
      boxes: inProgressTrips[index].boxes.filter((box) => box.id !== boxId),
    });
    const next = [...inProgressTrips];
    next[index] = nextTrip;
    set({ inProgressTrips: next, focusedTripId: tripId });
    void saveInProgressTrips(next);
  },

  closeTrip: async (tripId) => {
    const { inProgressTrips, closedTrips, focusedTripId } = get();
    const trip = inProgressTrips.find((entry) => entry.id === tripId);
    if (!trip) return;

    const nextInProgress = inProgressTrips.filter((entry) => entry.id !== tripId);
    const closedTrip: LoadTrip = {
      ...trip,
      status: "closed",
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    };
    const nextClosed = [closedTrip, ...closedTrips];

    set({
      inProgressTrips: nextInProgress,
      closedTrips: nextClosed,
      focusedTripId:
        focusedTripId === tripId
          ? (nextInProgress[0]?.id ?? null)
          : focusedTripId,
    });
    await saveInProgressTrips(nextInProgress);
    await saveClosedTrips(nextClosed);
  },

  deleteTrip: async (tripId) => {
    const { inProgressTrips, closedTrips, focusedTripId } = get();
    const nextInProgress = inProgressTrips.filter((entry) => entry.id !== tripId);
    const nextClosed = closedTrips.filter((entry) => entry.id !== tripId);

    set({
      inProgressTrips: nextInProgress,
      closedTrips: nextClosed,
      focusedTripId:
        focusedTripId === tripId
          ? (nextInProgress[0]?.id ?? null)
          : focusedTripId,
    });
    await saveInProgressTrips(nextInProgress);
    await saveClosedTrips(nextClosed);
  },

  markSynced: async (tripId: string, syncedAt: string) => {
    const { closedTrips } = get();
    const nextClosed = closedTrips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            syncStatus: "synced" as const,
            syncError: undefined,
            updatedAt: syncedAt,
          }
        : t
    );
    set({ closedTrips: nextClosed });
    await saveClosedTrips(nextClosed);
  },

  markSyncError: async (tripId: string, error: string) => {
    const { closedTrips } = get();
    const nextClosed = closedTrips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            syncStatus: "error" as const,
            syncError: error,
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    set({ closedTrips: nextClosed });
    await saveClosedTrips(nextClosed);
  },
}));
