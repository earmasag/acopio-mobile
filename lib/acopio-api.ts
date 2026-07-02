import type { CategoryId } from "@/constants/categories";
import type { ApiProductMatch } from "@/lib/barcode-api";
import type { PackOrder } from "@/types/pack";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://acopio-api.onrender.com";

// Mapeo entre identificadores numéricos de la BD y Categorías del móvil
const CATEGORY_TO_ID: Record<CategoryId, number> = {
  medicamentos: 1,
  insumos_medicos: 2,
  comida: 3,
  bebida: 4,
  ropa: 5,
  juguetes: 6,
};

const ID_TO_CATEGORY: Record<number, CategoryId> = {
  1: "medicamentos",
  2: "insumos_medicos",
  3: "comida",
  4: "bebida",
  5: "ropa",
  6: "juguetes",
};

export function mapCategoryToNumericId(categoryId: CategoryId): number {
  return CATEGORY_TO_ID[categoryId] ?? 1;
}

export function mapNumericIdToCategory(numericId?: number | null): CategoryId {
  if (numericId !== undefined && numericId !== null && ID_TO_CATEGORY[numericId]) {
    return ID_TO_CATEGORY[numericId];
  }
  return "comida"; // fallback por defecto
}

/**
 * Consulta el catálogo local en nuestra propia Base de Datos (Render).
 * Primer paso ultrarrápido del flujo de escaneo.
 */
export async function fetchProductFromAcopioDb(barcode: string): Promise<ApiProductMatch | null> {
  const cleanBarcode = barcode.trim().replace(/[- ]/g, "");
  if (!cleanBarcode) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(cleanBarcode)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 200) {
      const data = await response.json();
      if (data && data.name) {
        console.log(`[AcopioDB] Producto encontrado instantáneamente en BD central: "${data.name}" (${cleanBarcode})`);
        return {
          name: data.name,
          brand: data.brand || undefined,
          categoryId: mapNumericIdToCategory(data.category_id),
          barcode: data.barcode || cleanBarcode,
          sourceApi: "acopio_db",
          imageUrl: data.image_url || undefined,
        };
      }
    } else if (response.status === 404) {
      console.log(`[AcopioDB] El producto ${cleanBarcode} no está en BD propia. Consultando APIs externas...`);
    }
  } catch (error: any) {
    console.warn(`[AcopioDB] Error al consultar la base de datos central (${API_BASE_URL}):`, error?.message || error);
  }

  return null;
}

/**
 * Registra o sincroniza un producto encontrado en APIs externas hacia nuestra BD propia (Cache-Aside pattern).
 */
export async function saveProductToAcopioDb(match: ApiProductMatch): Promise<void> {
  if (!match.barcode || !match.name) return;

  try {
    const payload = {
      barcode: match.barcode.trim(),
      name: match.name.trim(),
      brand: match.brand ? match.brand.trim() : null,
      category_id: mapCategoryToNumericId(match.categoryId),
      source_api: match.sourceApi || "external_api",
      image_url: match.imageUrl || null,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/products/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201 || response.status === 200) {
      console.log(`[AcopioDB] Producto guardado en catálogo de BD central con éxito: "${match.name}" (${match.barcode})`);
    } else {
      const errText = await response.text().catch(() => "");
      console.warn(`[AcopioDB] BD central respondió HTTP ${response.status} al guardar producto:`, errText);
    }
  } catch (error: any) {
    console.warn("[AcopioDB] No se pudo guardar producto en segundo plano hacia la BD central:", error?.message || error);
  }
}

export async function validateCentroAcopio(campCode: string): Promise<{ valid: boolean; campName?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/camps/validate/${encodeURIComponent(campCode)}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) return { valid: false };
    const data = await response.json();
    return { valid: data.valid, campName: data.camp_name };
  } catch (error) {
    console.error("[AcopioDB] Error validating camp code:", error);
    return { valid: false };
  }
}

/**
 * Sincroniza los eventos logísticos (armado/cierre de cajas) con la API central.
 */
export async function syncPackOrderToBackend(
  order: PackOrder,
  centroAcopioId: string,
  operatorName: string = "Voluntario Móvil"
): Promise<{ success: boolean; message: string; response?: any }> {
  try {
    const syncId = crypto.randomUUID();
    const packageUuid = order.packageUuid || `CAJA-${order.id.slice(0, 8).toUpperCase()}`;
    const timestamp = order.updatedAt || new Date().toISOString();

    const events = [];

    // 1. Evento de inicio
    events.push({
      event_id: crypto.randomUUID(),
      package_uuid: packageUuid,
      action: "PACK_START",
      device_timestamp: order.createdAt || timestamp,
      operator_name: operatorName,
      payload: {},
    });

    // 2. Eventos por cada ítem
    for (const item of order.items) {
      const payload: any = {
        category_id: mapCategoryToNumericId(item.categoryId),
        quantity: item.quantity,
        item_name: item.name,
      };
      
      if (item.barcode) payload.barcode = item.barcode;
      
      if (item.categoryId === "ropa") {
        payload.garment_type_id = item.garmentType || "desconocido";
        payload.size = item.size || "Única";
      }

      events.push({
        event_id: crypto.randomUUID(),
        package_uuid: packageUuid,
        action: "PACK_ADD_ITEM",
        device_timestamp: timestamp,
        operator_name: operatorName,
        payload,
      });
    }

    // 3. Evento de sellado
    events.push({
      event_id: crypto.randomUUID(),
      package_uuid: packageUuid,
      action: "PACK_SEAL",
      device_timestamp: timestamp,
      operator_name: operatorName,
      payload: {},
    });

    const payload = {
      sync_id: syncId,
      centro_acopio_id: centroAcopioId,
      events,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[AcopioDB] Sincronización de caja exitosa:", data);
      return { success: true, message: "Caja sincronizada con el servidor.", response: data };
    } else {
      const errBody = await response.text().catch(() => "");
      console.error(`[AcopioDB] Error de sincronización (HTTP ${response.status}):`, errBody);
      return { success: false, message: `Error en servidor: HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.error("[AcopioDB] Error de red al sincronizar caja:", error);
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
}
