export type LoadTripStatus = "in_progress" | "closed";

export type LoadedBox = {
  id: string;
  packageUuid: string;
  scannedAt: string;
};

export type LoadTrip = {
  id: string;
  plate: string;
  boxes: LoadedBox[];
  status: LoadTripStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  syncStatus?: "pending" | "synced" | "error";
  syncError?: string;
};

/** @deprecated Solo para migración desde `label` */
type LegacyLoadTrip = LoadTrip & { label?: string };

export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase();
}

export function isValidPlate(plate: string): boolean {
  return normalizePlate(plate).length > 0;
}

export function migrateLoadTrip(raw: LegacyLoadTrip): LoadTrip {
  const { label, ...trip } = raw;
  return {
    ...trip,
    plate: trip.plate ?? label ?? "",
    status: trip.status === "closed" ? "closed" : "in_progress",
  };
}

export function createLoadTrip(plate: string): LoadTrip {
  const now = new Date().toISOString();
  return {
    id: createLoadId(),
    plate: normalizePlate(plate),
    boxes: [],
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
}

export function createLoadId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createLoadedBox(packageUuid: string): LoadedBox {
  return {
    id: createLoadId(),
    packageUuid,
    scannedAt: new Date().toISOString(),
  };
}
