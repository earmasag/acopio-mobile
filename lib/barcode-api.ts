import apiConfig from "@/constants/barcode-apis.json";
import type { CategoryId } from "@/constants/categories";

export type ApiProductMatch = {
  name: string;
  brand?: string;
  categoryId: CategoryId;
  barcode: string;
  sourceApi: string;
  imageUrl?: string;
  priceRange?: string;
};

export function validateBarcode(barcode: string): { isValid: boolean; message: string } {
  const clean = barcode.trim().replace(/[- ]/g, "");
  if (!clean) {
    return { isValid: false, message: "El código está vacío." };
  }

  // ISBN-10
  if (clean.length === 10) {
    let total = 0;
    for (let i = 0; i < 9; i++) {
      if (!/\d/.test(clean[i])) {
        return { isValid: false, message: "Los primeros 9 caracteres de un ISBN-10 deben ser números." };
      }
      total += parseInt(clean[i], 10) * (10 - i);
    }
    const lastChar = clean[9].toUpperCase();
    if (lastChar === "X") {
      total += 10;
    } else if (/\d/.test(lastChar)) {
      total += parseInt(lastChar, 10);
    } else {
      return { isValid: false, message: "Dígito verificador de ISBN-10 incorrecto." };
    }

    if (total % 11 === 0) {
      return { isValid: true, message: "ISBN-10 Válido" };
    }
    return { isValid: false, message: "Dígito verificador de ISBN-10 incorrecto." };
  }

  // EAN-8, UPC-A (12), EAN-13 (13), GTIN-14 (14)
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, message: "El código contiene caracteres no numéricos." };
  }

  if ([8, 12, 13, 14].includes(clean.length)) {
    const digits = clean.split("").map((d) => parseInt(d, 10));
    const checkDigit = digits[digits.length - 1];
    const payload = digits.slice(0, -1);

    let total = 0;
    for (let i = payload.length - 1, step = 0; i >= 0; i--, step++) {
      const weight = step % 2 === 0 ? 3 : 1;
      total += payload[i] * weight;
    }

    const calculated = (10 - (total % 10)) % 10;
    if (calculated === checkDigit) {
      const tipo =
        clean.length === 8
          ? "EAN-8"
          : clean.length === 12
            ? "UPC-A"
            : clean.length === 13
              ? "EAN-13"
              : "GTIN-14";
      return { isValid: true, message: `${tipo} Válido` };
    }
    return { isValid: false, message: `Dígito verificador incorrecto (esperado: ${calculated}).` };
  }

  return {
    isValid: false,
    message: `Longitud no estándar (${clean.length} dígitos). Formatos soportados: EAN-8, UPC-A, EAN-13, ISBN-10, GTIN-14.`,
  };
}

function shouldQueryApi(barcode: string, routingRules?: any): boolean {
  if (!routingRules) return true;
  const prefix = barcode.trim().slice(0, 3);

  if (Array.isArray(routingRules.excluded_prefixes)) {
    if (routingRules.excluded_prefixes.includes(prefix)) {
      return false;
    }
  }

  if (Array.isArray(routingRules.required_prefixes) && routingRules.required_prefixes.length > 0) {
    if (!routingRules.required_prefixes.includes(prefix)) {
      return false;
    }
  }

  return true;
}

async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit,
  timeoutSeconds: number,
  maxRetries: number,
  backoffFactor: number,
): Promise<Response> {
  let attempt = 0;
  let delayMs = 1000;

  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt >= maxRetries) {
        throw err;
      }
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = delayMs * backoffFactor;
    }
  }
}

function mapToAppCategory(apiKey: string, rawCategoryText?: string, productName?: string): CategoryId {
  const searchStr = `${rawCategoryText || ""} ${productName || ""} ${apiKey}`.toLowerCase();

  if (
    searchStr.includes("drink") ||
    searchStr.includes("beverage") ||
    searchStr.includes("water") ||
    searchStr.includes("agua") ||
    searchStr.includes("juice") ||
    searchStr.includes("jugo") ||
    searchStr.includes("soda") ||
    searchStr.includes("refresco") ||
    searchStr.includes("milk") ||
    searchStr.includes("leche") ||
    searchStr.includes("bebida")
  ) {
    return "bebida";
  }

  if (
    searchStr.includes("medicine") ||
    searchStr.includes("pharma") ||
    searchStr.includes("medicamento") ||
    searchStr.includes("drug") ||
    searchStr.includes("pill") ||
    searchStr.includes("tablet") ||
    searchStr.includes("capsule") ||
    searchStr.includes("paracetamol") ||
    searchStr.includes("ibuprofen")
  ) {
    return "medicamentos";
  }

  if (
    searchStr.includes("medical") ||
    searchStr.includes("first aid") ||
    searchStr.includes("bandage") ||
    searchStr.includes("hygiene") ||
    searchStr.includes("soap") ||
    searchStr.includes("shampoo") ||
    searchStr.includes("jabon") ||
    searchStr.includes("insumo") ||
    searchStr.includes("beauty") ||
    searchStr.includes("cosmetic")
  ) {
    return "insumos_medicos";
  }

  if (
    searchStr.includes("clothing") ||
    searchStr.includes("shirt") ||
    searchStr.includes("shoe") ||
    searchStr.includes("ropa") ||
    searchStr.includes("camisa") ||
    searchStr.includes("calzado")
  ) {
    return "ropa";
  }

  if (
    searchStr.includes("toy") ||
    searchStr.includes("book") ||
    searchStr.includes("juguete") ||
    searchStr.includes("libro") ||
    apiKey.includes("library")
  ) {
    return "juguetes";
  }

  return "comida";
}

async function querySingleApi(apiKey: string, apiDefinition: any, barcode: string): Promise<ApiProductMatch | null> {
  const globalTimeout = apiConfig.global_settings?.default_timeout_seconds ?? 12.0;
  const maxRetries = apiConfig.global_settings?.retry_policy?.max_retries ?? 2;
  const backoffFactor = apiConfig.global_settings?.retry_policy?.backoff_factor ?? 1.5;

  let url = apiDefinition.base_url.replace("{barcode}", barcode);

  if (apiDefinition.optimization?.use_fields_filter && Array.isArray(apiDefinition.optimization.fields)) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}fields=${apiDefinition.optimization.fields.join(",")}`;
  }

  try {
    const response = await fetchWithRetryAndTimeout(
      url,
      {
        method: apiDefinition.method ?? "GET",
        headers: apiDefinition.headers ?? {},
      },
      globalTimeout,
      maxRetries,
      backoffFactor,
    );

    if (!response.ok) return null;
    const data = await response.json();

    if (apiKey.startsWith("open_") && apiKey.includes("facts")) {
      const product = data.product || (data.status === "success" || data.status === 1 ? data : null);
      if (product && (product.product_name || product.product_name_es)) {
        const name = (product.product_name_es || product.product_name).trim();
        return {
          name,
          brand: product.brands || undefined,
          categoryId: mapToAppCategory(apiKey, product.categories, name),
          barcode,
          sourceApi: apiKey,
          imageUrl: product.image_url || product.image_front_url || undefined,
        };
      }
    } else if (apiKey === "upcitemdb_trial") {
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        const item = data.items[0];
        const name = (item.title || "").trim();
        if (name) {
          const lowest = item.lowest_recorded_price;
          const highest = item.highest_recorded_price;
          const currency = item.currency || "USD";
          const priceRange = lowest || highest ? `${lowest} ~ ${highest} ${currency}` : undefined;
          return {
            name,
            brand: item.brand || undefined,
            categoryId: mapToAppCategory(apiKey, item.category, name),
            barcode,
            sourceApi: apiKey,
            imageUrl: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined,
            priceRange,
          };
        }
      }
    } else if (apiKey === "open_library") {
      const key = `ISBN:${barcode}`;
      if (data && data[key]) {
        const book = data[key];
        const name = (book.title || "").trim();
        if (name) {
          const publisher = Array.isArray(book.publishers) ? book.publishers[0]?.name : undefined;
          const coverUrl = book.cover?.large || book.cover?.medium || book.cover?.small;
          return {
            name,
            brand: publisher,
            categoryId: "juguetes",
            barcode,
            sourceApi: apiKey,
            imageUrl: coverUrl,
          };
        }
      }
    } else if (apiKey === "open_fda") {
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const drug = data.results[0];
        const name = (drug.generic_name || drug.brand_name || "").trim();
        if (name) {
          return {
            name,
            brand: drug.labeler_name || undefined,
            categoryId: "medicamentos",
            barcode,
            sourceApi: apiKey,
          };
        }
      }
    }
  } catch (error) {
    console.warn(`[BarcodeSearch] Falló consulta a API ${apiKey}:`, error);
  }

  return null;
}

export async function searchBarcodePublicApis(barcode: string): Promise<ApiProductMatch[]> {
  const cleanBarcode = barcode.trim().replace(/[- ]/g, "");
  const apis = apiConfig.apis || {};

  const authorizedApis = Object.entries(apis).filter(([_, definition]) => {
    return shouldQueryApi(cleanBarcode, definition.routing_rules);
  });

  const promises = authorizedApis.map(([key, definition]) => querySingleApi(key, definition, cleanBarcode));
  const results = await Promise.all(promises);

  const validResults = results.filter((r): r is ApiProductMatch => r !== null && !!r.name);

  // Deduplicación inteligente por nombre
  const uniqueMatches: ApiProductMatch[] = [];
  const seenNames = new Set<string>();

  for (const match of validResults) {
    const normalized = match.name.toLowerCase().trim();
    if (!seenNames.has(normalized)) {
      seenNames.add(normalized);
      uniqueMatches.push(match);
    }
  }

  return uniqueMatches;
}
