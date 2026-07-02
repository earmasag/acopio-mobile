import { create } from "zustand";

import {
  loadDraftOrders,
  loadInProgressOrders,
  loadSealedOrders,
  saveDraftOrders,
  saveInProgressOrders,
  saveSealedOrders,
} from "@/lib/pack-order-storage";
import { createEmptyOrder, createManualLineItem, type ManualItemInput, type PackOrder } from "@/types/pack";

type PackOrderStore = {
  hydrated: boolean;
  inProgressOrders: PackOrder[];
  drafts: PackOrder[];
  sealedOrders: PackOrder[];
  focusedOrderId: string | null;
  hydrate: () => Promise<void>;
  getOrder: (orderId: string) => PackOrder | undefined;
  getFocusedOrder: () => PackOrder | undefined;
  createOrder: () => PackOrder;
  focusOrder: (orderId: string) => void;
  setPackageUuid: (orderId: string, packageUuid: string) => PackOrder | undefined;
  persistOrder: (order: PackOrder) => Promise<void>;
  parkOrderAsDraft: (orderId: string) => Promise<void>;
  resumeDraft: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  addManualItem: (
    orderId: string,
    input: ManualItemInput,
  ) => Promise<void>;
  updateItemQuantity: (
    orderId: string,
    itemId: string,
    quantity: number,
  ) => Promise<void>;
  removeItem: (orderId: string, itemId: string) => Promise<void>;
  sealOrder: (orderId: string) => Promise<void>;
  markSynced: (orderId: string, syncedAt: string) => Promise<void>;
  markSyncError: (orderId: string, error: string) => Promise<void>;
};

function touch(order: PackOrder): PackOrder {
  return { ...order, updatedAt: new Date().toISOString() };
}

async function persistInProgress(orders: PackOrder[]) {
  await saveInProgressOrders(orders);
}

async function persistDrafts(orders: PackOrder[]) {
  await saveDraftOrders(orders);
}

export const usePackOrderStore = create<PackOrderStore>((set, get) => ({
  hydrated: false,
  inProgressOrders: [],
  drafts: [],
  sealedOrders: [],
  focusedOrderId: null,

  hydrate: async () => {
    const [inProgressOrders, drafts, sealedOrders] = await Promise.all([
      loadInProgressOrders(),
      loadDraftOrders(),
      loadSealedOrders(),
    ]);
    set({
      inProgressOrders,
      drafts,
      sealedOrders,
      focusedOrderId: inProgressOrders[0]?.id ?? null,
      hydrated: true,
    });
  },

  getOrder: (orderId) => {
    const { inProgressOrders, drafts, sealedOrders } = get();
    return (
      inProgressOrders.find((order) => order.id === orderId) ??
      drafts.find((order) => order.id === orderId) ??
      sealedOrders.find((order) => order.id === orderId)
    );
  },

  getFocusedOrder: () => {
    const { focusedOrderId } = get();
    if (!focusedOrderId) return undefined;
    return get().getOrder(focusedOrderId);
  },

  createOrder: () => {
    const order = createEmptyOrder("in_progress");
    const next = [order, ...get().inProgressOrders];
    set({ inProgressOrders: next, focusedOrderId: order.id });
    void persistInProgress(next);
    return order;
  },

  focusOrder: (orderId) => {
    if (!get().getOrder(orderId)) return;
    set({ focusedOrderId: orderId });
  },

  setPackageUuid: (orderId, packageUuid) => {
    const { inProgressOrders } = get();
    const index = inProgressOrders.findIndex((order) => order.id === orderId);
    if (index === -1) return undefined;

    const nextOrder = touch({ ...inProgressOrders[index], packageUuid });
    const next = [...inProgressOrders];
    next[index] = nextOrder;
    set({ inProgressOrders: next, focusedOrderId: orderId });
    void persistInProgress(next);
    return nextOrder;
  },

  persistOrder: async (order) => {
    const nextOrder = touch(order);

    if (nextOrder.status === "in_progress") {
      const next = get().inProgressOrders.map((item) =>
        item.id === nextOrder.id ? nextOrder : item,
      );
      set({ inProgressOrders: next, focusedOrderId: nextOrder.id });
      await persistInProgress(next);
      return;
    }

    const nextDrafts = get().drafts.map((item) =>
      item.id === nextOrder.id ? nextOrder : item,
    );
    set({ drafts: nextDrafts, focusedOrderId: nextOrder.id });
    await persistDrafts(nextDrafts);
  },

  parkOrderAsDraft: async (orderId) => {
    const { inProgressOrders, drafts } = get();
    const order = inProgressOrders.find((item) => item.id === orderId);
    if (!order) return;

    const nextInProgress = inProgressOrders.filter((item) => item.id !== orderId);
    const draftOrder = touch({ ...order, status: "draft" });
    const nextDrafts = [
      draftOrder,
      ...drafts.filter((item) => item.id !== orderId),
    ];

    set({
      inProgressOrders: nextInProgress,
      drafts: nextDrafts,
      focusedOrderId: nextInProgress[0]?.id ?? null,
    });
    await persistInProgress(nextInProgress);
    await persistDrafts(nextDrafts);
  },

  resumeDraft: async (orderId) => {
    const { inProgressOrders, drafts } = get();
    const order = drafts.find((item) => item.id === orderId);
    if (!order) return;

    const nextDrafts = drafts.filter((item) => item.id !== orderId);
    const resumed = touch({ ...order, status: "in_progress" });
    const nextInProgress = [
      resumed,
      ...inProgressOrders.filter((item) => item.id !== orderId),
    ];

    set({
      inProgressOrders: nextInProgress,
      drafts: nextDrafts,
      focusedOrderId: orderId,
    });
    await persistInProgress(nextInProgress);
    await persistDrafts(nextDrafts);
  },

  deleteOrder: async (orderId) => {
    const { inProgressOrders, drafts, focusedOrderId } = get();
    const nextInProgress = inProgressOrders.filter((item) => item.id !== orderId);
    const nextDrafts = drafts.filter((item) => item.id !== orderId);

    set({
      inProgressOrders: nextInProgress,
      drafts: nextDrafts,
      focusedOrderId:
        focusedOrderId === orderId
          ? (nextInProgress[0]?.id ?? null)
          : focusedOrderId,
    });
    await persistInProgress(nextInProgress);
    await persistDrafts(nextDrafts);
  },

  addManualItem: async (orderId, input) => {
    const order = get().getOrder(orderId);
    if (!order || order.status !== "in_progress") return;

    const name = input.name.trim();
    if (!name || input.quantity < 1) return;

    const isManualEntry = !input.source || input.source === "manual";
    if (isManualEntry && input.categoryId === "ropa" && (!input.garmentType || !input.size)) {
      return;
    }

    const item = createManualLineItem({ ...input, name });
    const nextOrder = touch({ ...order, items: [...order.items, item] });
    const next = get().inProgressOrders.map((entry) =>
      entry.id === orderId ? nextOrder : entry,
    );
    set({ inProgressOrders: next, focusedOrderId: orderId });
    await persistInProgress(next);
  },

  updateItemQuantity: async (orderId, itemId, quantity) => {
    if (quantity < 1) return;

    const order = get().getOrder(orderId);
    if (!order || order.status !== "in_progress") return;

    const nextOrder = touch({
      ...order,
      items: order.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item,
      ),
    });
    const next = get().inProgressOrders.map((entry) =>
      entry.id === orderId ? nextOrder : entry,
    );
    set({ inProgressOrders: next, focusedOrderId: orderId });
    await persistInProgress(next);
  },

  removeItem: async (orderId, itemId) => {
    const order = get().getOrder(orderId);
    if (!order || order.status !== "in_progress") return;

    const nextOrder = touch({
      ...order,
      items: order.items.filter((item) => item.id !== itemId),
    });
    const next = get().inProgressOrders.map((entry) =>
      entry.id === orderId ? nextOrder : entry,
    );
    set({ inProgressOrders: next, focusedOrderId: orderId });
    await persistInProgress(next);
  },

  sealOrder: async (orderId) => {
    const { inProgressOrders, sealedOrders } = get();
    const order = inProgressOrders.find((item) => item.id === orderId);
    if (!order) return;

    const sealedOrder = touch({
      ...order,
      status: "sealed",
      syncStatus: "pending",
    });
    const nextInProgress = inProgressOrders.filter((item) => item.id !== orderId);
    const nextSealed = [sealedOrder, ...sealedOrders];

    set({
      inProgressOrders: nextInProgress,
      sealedOrders: nextSealed,
      focusedOrderId: nextInProgress[0]?.id ?? null,
    });
    await persistInProgress(nextInProgress);
    await saveSealedOrders(nextSealed);
  },

  markSynced: async (orderId, syncedAt) => {
    const { sealedOrders } = get();
    const nextSealed = sealedOrders.map((order) =>
      order.id === orderId
        ? { ...order, syncStatus: "synced" as const, syncedAt, syncError: undefined }
        : order
    );
    set({ sealedOrders: nextSealed });
    await saveSealedOrders(nextSealed);
  },

  markSyncError: async (orderId, error) => {
    const { sealedOrders } = get();
    const nextSealed = sealedOrders.map((order) =>
      order.id === orderId
        ? { ...order, syncStatus: "error" as const, syncError: error }
        : order
    );
    set({ sealedOrders: nextSealed });
    await saveSealedOrders(nextSealed);
  },
}));
