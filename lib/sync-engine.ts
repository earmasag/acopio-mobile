import { syncPackOrderToBackend } from "@/lib/acopio-api";
import { usePackOrderStore } from "@/stores/pack-order-store";
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
    if (!settings.centroAcopioId) return;

    const pendingOrders = store.sealedOrders.filter(
      (order) => order.syncStatus === "pending" || order.syncStatus === "error"
    );

    for (const order of pendingOrders) {
      const result = await syncPackOrderToBackend(order, settings.centroAcopioId);
      if (result.success) {
        await store.markSynced(order.id, new Date().toISOString());
      } else {
        await store.markSyncError(order.id, result.message);
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
