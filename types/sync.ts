/**
 * Acciones válidas que el backend espera.
 * Se deja abierto a `string & {}` para extensibilidad (asumimos la deuda técnica),
 * pero los literales brindan autocompletado en el IDE para el frontend.
 */
export type LogisticaAction = 
  | "PACK_START"
  | "PACK_ADD_ITEM"
  | "PACK_SEAL"
  | "LOAD_SCAN"
  | "RECEIVE_SCAN"
  | (string & {});

export interface LogisticaEventPayload {
  category_id?: number;
  quantity?: number;
  // Para futuras extensiones (ej. peso, tipo de prenda, destino)
  [key: string]: any; 
}

/**
 * Representa un evento individual ocurrido offline en el dispositivo móvil.
 */
export interface LogisticaEvent {
  event_id: string; // UUID v4 generado localmente al momento del evento
  package_uuid: string; // El QR escaneado (el identificador de la caja)
  action: LogisticaAction; 
  device_timestamp: string; // Fecha en formato ISO 8601 (ej. new Date().toISOString())
  operator_name: string; // Nombre del voluntario que realizó la acción
  payload?: LogisticaEventPayload; // Datos adicionales (ej. category_id en PACK_ADD_ITEM)
}

/**
 * Payload completo que se enviará en el POST /api/v1/sync
 */
export interface SyncPayload {
  sync_id: string; // UUID v4 generado para este lote específico de eventos
  centro_acopio_id: string; // Identificador del centro de acopio o campamento actual
  events: LogisticaEvent[]; // Lista de eventos encolados
}

/**
 * Detalle de un evento que falló reglas de negocio en el backend y fue a la Dead-Letter Queue
 */
export interface FailedEventDetail {
  event_id: string; // El UUID del evento específico que falló
  reason: string; // Mensaje de error devuelto por la API
}

/**
 * Posibles estados de la respuesta de sincronización
 */
export type SyncStatus = "success" | "partial_success" | "all_failed" | "duplicate";

/**
 * Respuesta que devuelve el servidor tras procesar un SyncPayload
 */
export interface SyncResponse {
  status: SyncStatus;
  sync_id: string;
  processed: number;
  failed: number;
  failed_events: FailedEventDetail[];
}
