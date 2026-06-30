import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PackOrder } from "@/types/pack";

const LEGACY_ACTIVE_ORDER_KEY = "@acopio/pack-active-order";
const IN_PROGRESS_ORDERS_KEY = "@acopio/pack-in-progress-orders";
const DRAFT_ORDERS_KEY = "@acopio/pack-draft-orders";

export async function loadInProgressOrders(): Promise<PackOrder[]> {
  const raw = await AsyncStorage.getItem(IN_PROGRESS_ORDERS_KEY);
  if (raw) return JSON.parse(raw) as PackOrder[];

  const legacy = await AsyncStorage.getItem(LEGACY_ACTIVE_ORDER_KEY);
  if (!legacy) return [];

  const order = { ...(JSON.parse(legacy) as PackOrder), status: "in_progress" as const };
  await saveInProgressOrders([order]);
  await AsyncStorage.removeItem(LEGACY_ACTIVE_ORDER_KEY);
  return [order];
}

export async function saveInProgressOrders(orders: PackOrder[]): Promise<void> {
  await AsyncStorage.setItem(IN_PROGRESS_ORDERS_KEY, JSON.stringify(orders));
}

export async function loadDraftOrders(): Promise<PackOrder[]> {
  const raw = await AsyncStorage.getItem(DRAFT_ORDERS_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as PackOrder[]).map((order) => ({
    ...order,
    status: "draft" as const,
  }));
}

export async function saveDraftOrders(orders: PackOrder[]): Promise<void> {
  await AsyncStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(orders));
}
