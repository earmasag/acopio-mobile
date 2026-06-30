import type { CategoryId } from "@/constants/categories";
import type { GarmentTypeId } from "@/constants/clothing";

export type PackLineItem = {
  id: string;
  categoryId: CategoryId;
  name: string;
  quantity: number;
  barcode?: string;
  source: "scan" | "manual";
  garmentType?: GarmentTypeId | string;
  size?: string;
};

export type ManualItemInput = {
  categoryId: CategoryId;
  name: string;
  quantity: number;
  garmentType?: GarmentTypeId | string;
  size?: string;
};

export type PackOrderStatus = "in_progress" | "draft";

export type PackOrder = {
  id: string;
  packageUuid?: string;
  items: PackLineItem[];
  createdAt: string;
  updatedAt: string;
  status: PackOrderStatus;
};

export function createEmptyOrder(status: PackOrderStatus = "in_progress"): PackOrder {
  const now = new Date().toISOString();
  return {
    id: createLocalId(),
    items: [],
    createdAt: now,
    updatedAt: now,
    status,
  };
}

export function createLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parsePackageQr(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = JSON.parse(trimmed) as { uuid?: string; id?: string };
    return parsed.uuid ?? parsed.id ?? trimmed;
  } catch {
    return trimmed;
  }
}

export function shortUuid(uuid?: string): string {
  if (!uuid) return "Sin caja";
  return uuid.length > 12 ? `${uuid.slice(0, 8)}…` : uuid;
}

export function isOrderEmpty(order: PackOrder): boolean {
  return order.items.length === 0 && !order.packageUuid;
}

export function formatItemLabel(item: PackLineItem): string {
  return item.name;
}

export function createManualLineItem(input: ManualItemInput): PackLineItem {
  return {
    id: createLocalId(),
    categoryId: input.categoryId,
    name: input.name.trim(),
    quantity: input.quantity,
    source: "manual",
    garmentType: input.garmentType,
    size: input.size,
  };
}
