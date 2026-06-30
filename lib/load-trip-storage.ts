import AsyncStorage from "@react-native-async-storage/async-storage";

import { migrateLoadTrip, type LoadTrip } from "@/types/load";

const LEGACY_ACTIVE_TRIP_KEY = "@acopio/load-active-trip";
const IN_PROGRESS_TRIPS_KEY = "@acopio/load-in-progress-trips";
const CLOSED_TRIPS_KEY = "@acopio/load-closed-trips";

function parseTrips(raw: string): LoadTrip[] {
  return (JSON.parse(raw) as LoadTrip[]).map((trip) =>
    migrateLoadTrip(trip as LoadTrip & { label?: string }),
  );
}

export async function loadInProgressTrips(): Promise<LoadTrip[]> {
  const raw = await AsyncStorage.getItem(IN_PROGRESS_TRIPS_KEY);
  if (raw) {
    return parseTrips(raw).map((trip) => ({
      ...trip,
      status: "in_progress" as const,
    }));
  }

  const legacy = await AsyncStorage.getItem(LEGACY_ACTIVE_TRIP_KEY);
  if (!legacy) return [];

  const trip = migrateLoadTrip({
    ...(JSON.parse(legacy) as LoadTrip & { label?: string }),
    status: "in_progress",
  });
  await saveInProgressTrips([trip]);
  await AsyncStorage.removeItem(LEGACY_ACTIVE_TRIP_KEY);
  return [trip];
}

export async function saveInProgressTrips(trips: LoadTrip[]): Promise<void> {
  await AsyncStorage.setItem(IN_PROGRESS_TRIPS_KEY, JSON.stringify(trips));
}

export async function loadClosedTrips(): Promise<LoadTrip[]> {
  const raw = await AsyncStorage.getItem(CLOSED_TRIPS_KEY);
  if (!raw) return [];
  return parseTrips(raw).map((trip) => ({
    ...trip,
    status: "closed" as const,
  }));
}

export async function saveClosedTrips(trips: LoadTrip[]): Promise<void> {
  await AsyncStorage.setItem(CLOSED_TRIPS_KEY, JSON.stringify(trips));
}
