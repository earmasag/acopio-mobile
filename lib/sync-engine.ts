import { syncPackOrderToBackend, syncLoadTripToBackend, syncReceiveSessionToBackend } from "@/lib/acopio-api";
import { usePackOrderStore } from "@/stores/pack-order-store";
import { useLoadTripStore } from "@/stores/load-trip-store";
import { useReceiveSessionStore } from "@/stores/receive-session-store";
import { useSettingsStore } from "@/stores/settings-store";

let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

export async function processSyncQueue(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const store = usePackOrderStore.getState();
    const settings = useSettingsStore.getState();
    
    // Si no hay centro configurado, no podemos sincronizar
    if (!settings.centerCode) return;

    const pendingOrders = store.sealedOrders.filter(
      (order) => order.syncStatus === "pending" || order.syncStatus === "error"
    );

    for (const order of pendingOrders) {
      const result = await syncPackOrderToBackend(order, settings.centerCode);
      if (result.success) {
        await store.markSynced(order.id, new Date().toISOString());
      } else {
        await store.markSyncError(order.id, result.message);
      }
    }

    // 2. Procesar Load Trips (Camiones)
    const tripStore = useLoadTripStore.getState();
    const pendingTrips = tripStore.closedTrips.filter(
      (trip) => trip.syncStatus === "pending" || trip.syncStatus === "error"
    );

    for (const trip of pendingTrips) {
      const result = await syncLoadTripToBackend(trip, settings.centerCode);
      if (result.success) {
        await tripStore.markSynced(trip.id, new Date().toISOString());
      } else {
        await tripStore.markSyncError(trip.id, result.message);
      }
    }

    // 3. Procesar Receive Sessions (Recepción)
    const receiveStore = useReceiveSessionStore.getState();
    const pendingReceives = receiveStore.closedSessions.filter(
      (session) => session.syncStatus === "pending" || session.syncStatus === "error"
    );

    for (const session of pendingReceives) {
      const result = await syncReceiveSessionToBackend(session, settings.centerCode);
      if (result.success) {
        await receiveStore.markSynced(session.id, new Date().toISOString());
      } else {
        await receiveStore.markSyncError(session.id, result.message);
      }
    }
  } catch (error) {
    console.error("[SyncEngine] Unhandled error during sync queue processing:", error);
  } finally {
    isSyncing = false;
  }
}

export function startSyncEngine(intervalMs = 30_000): void {
  if (syncIntervalId !== null) return;
  
  // Initial check on start
  void processSyncQueue();

  // Schedule background retry
  syncIntervalId = setInterval(() => {
    void processSyncQueue();
  }, intervalMs);
}

export function stopSyncEngine(): void {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
