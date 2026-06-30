export type ReceiveSessionStatus = "in_progress" | "closed";

export type ReceivedBox = {
  id: string;
  packageUuid: string;
  scannedAt: string;
};

export type ReceiveSession = {
  id: string;
  plate: string;
  boxes: ReceivedBox[];
  status: ReceiveSessionStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase();
}

export function isValidPlate(plate: string): boolean {
  return normalizePlate(plate).length > 0;
}

export function createReceiveSession(plate: string): ReceiveSession {
  const now = new Date().toISOString();
  return {
    id: createReceiveId(),
    plate: normalizePlate(plate),
    boxes: [],
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
}

export function createReceiveId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createReceivedBox(packageUuid: string): ReceivedBox {
  return {
    id: createReceiveId(),
    packageUuid,
    scannedAt: new Date().toISOString(),
  };
}
