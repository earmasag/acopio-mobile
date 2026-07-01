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
    searchStr.includes("cosmetic") ||
    searchStr.includes("alcohol") ||
    searchStr.includes("desinfect") ||
    searchStr.includes("sanitiz") ||
    searchStr.includes("limpi") ||
    searchStr.includes("antiseptic") ||
    searchStr.includes("gasa") ||
    searchStr.includes("jeringa") ||
    searchStr.includes("guante")
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

  // Fallback inteligente basado en la especialidad (allowed_categories) de la API
  const apiDef = (apiConfig.apis as any)[apiKey];
  if (apiDef?.routing_rules?.allowed_categories && Array.isArray(apiDef.routing_rules.allowed_categories)) {
    const categories = apiDef.routing_rules.allowed_categories;
    for (const cat of categories) {
      if (["comida", "bebida", "medicamentos", "insumos_medicos", "ropa", "juguetes"].includes(cat)) {
        return cat as CategoryId;
      }
    }
  }

  return "comida";
}

function getBarcodeCandidates(barcode: string): string[] {
  const clean = barcode.trim().replace(/[- ]/g, "");
  const candidates = new Set<string>([clean]);

  // Si tiene 12 dígitos (UPC-A), generar también versión EAN-13 (13 dígitos agregando un 0)
  if (clean.length === 12 && /^\d+$/.test(clean)) {
    candidates.add(`0${clean}`);
  }
  // Si tiene 13 dígitos y empieza por 0, generar también versión UPC-A (12 dígitos sin el 0)
  else if (clean.length === 13 && clean.startsWith("0") && /^\d+$/.test(clean)) {
    candidates.add(clean.slice(1));
  }

  // Si es un código EAN-13 farmacéutico español (empieza con 847000), extraer el Código Nacional (CN de 6 dígitos)
  if (clean.length === 13 && clean.startsWith("847000") && /^\d+$/.test(clean)) {
    candidates.add(clean.slice(6, 12));
  }

  // Si es un código de 6 o 7 dígitos, generar también posible prefijo farmacéutico EAN-13
  if (/^\d{6,7}$/.test(clean)) {
    candidates.add(`847000${clean}`);
  }

  return Array.from(candidates);
}

async function querySingleApiWithCandidate(apiKey: string, apiDefinition: any, barcodeCandidate: string): Promise<ApiProductMatch | null> {
  const globalTimeout = apiConfig.global_settings?.default_timeout_seconds ?? 12.0;
  const maxRetries = apiConfig.global_settings?.retry_policy?.max_retries ?? 2;
  const backoffFactor = apiConfig.global_settings?.retry_policy?.backoff_factor ?? 1.5;

  let url = apiDefinition.base_url.replace("{barcode}", barcodeCandidate);

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
          barcode: barcodeCandidate,
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
            barcode: barcodeCandidate,
            sourceApi: apiKey,
            imageUrl: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined,
            priceRange,
          };
        }
      }
    } else if (apiKey === "open_library") {
      const key = `ISBN:${barcodeCandidate}`;
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
            barcode: barcodeCandidate,
            sourceApi: apiKey,
            imageUrl: coverUrl,
          };
        }
      }
    } else if (apiKey === "access_gudid") {
      if (data && data.gudid && data.gudid.device) {
        const device = data.gudid.device;
        const name = (device.brandName || device.deviceDescription || "").trim();
        if (name) {
          return {
            name,
            brand: device.companyName || undefined,
            categoryId: "insumos_medicos",
            barcode: barcodeCandidate,
            sourceApi: apiKey,
          };
        }
      }
    } else if (apiKey.startsWith("openfda_")) {
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const item = data.results[0];
        const name = (item.generic_name || item.brand_name || item.brand_name_base || item.description || "").trim();
        if (name) {
          return {
            name,
            brand: item.labeler_name || item.company_name || undefined,
            categoryId: apiKey.includes("drugs") ? "medicamentos" : "insumos_medicos",
            barcode: barcodeCandidate,
            sourceApi: apiKey,
          };
        }
      }
    } else if (apiKey === "cima_medicamentos") {
      if (data && Array.isArray(data.resultados) && data.resultados.length > 0) {
        const med = data.resultados[0];
        const name = (med.nombre || "").trim();
        if (name) {
          return {
            name,
            brand: med.labtitular || undefined,
            categoryId: "medicamentos",
            barcode: barcodeCandidate,
            sourceApi: apiKey,
            imageUrl: Array.isArray(med.fotos) && med.fotos.length > 0 ? med.fotos[0].url : undefined,
          };
        }
      }
    } else if (apiKey === "brocade") {
      const name = (data.name || "").trim();
      if (name) {
        return {
          name,
          brand: data.brand || undefined,
          categoryId: mapToAppCategory(apiKey, data.category, name),
          barcode: barcodeCandidate,
          sourceApi: apiKey,
          imageUrl: data.image || undefined,
        };
      }
    }
  } catch (error) {
    console.warn(`[BarcodeSearch] Falló consulta a API ${apiKey} con candidato ${barcodeCandidate}:`, error);
  }

  return null;
}

export function cleanAndSummarizeProductName(rawTitle: string): string {
  if (!rawTitle) return "";

  let name = rawTitle
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Quitar prefijos descriptivos (Descripción, Producto, Nombre, Comprar, Precio de, Detalle)
  name = name.replace(/^(?:descripci[óo]n|producto|nombre|comprar|precio de|detalle de|venta de|art[íi]culo|medicamento)\s*:?\s*/i, "");

  // 2. Si contiene migas de pan (bread crumbs) como 'Inicio > Bienestar > Alivio > Difenac 100mg'
  if (name.includes(">")) {
    const segments = name.split(">").map((s) => s.trim()).filter(Boolean);
    if (segments.length > 0) {
      name = segments[segments.length - 1];
    }
  }

  // 3. Quitar sufijos de metadatos o e-commerce (' A DOMICILIO Principio activo:', ' EAN:', ' Impuesto:')
  const metaTriggers = [
    " a domicilio",
    " principio activo:",
    " ean:",
    " sku:",
    " código:",
    " codigo:",
    " impuesto:",
    " envío",
    " envio",
    " precio:",
    " exento",
  ];
  for (const meta of metaTriggers) {
    const idx = name.toLowerCase().indexOf(meta);
    if (idx > 3) {
      name = name.slice(0, idx).trim();
    }
  }

  // 4. Cortar en verbos o definiciones enciclopédicas (' se usa para', ' es un', ' actúa bloqueando')
  const descTriggers = [
    " es un ",
    " es una ",
    " es el ",
    " es la ",
    " que se utiliza ",
    " se usa para ",
    " se utiliza para ",
    " utilizado para ",
    " indicado para ",
    " actúa bloqueando ",
    " sirve para ",
    " contiene ",
    " ayuda a ",
  ];
  for (const trigger of descTriggers) {
    const idx = name.toLowerCase().indexOf(trigger);
    if (idx > 2) {
      name = name.slice(0, idx).trim();
    }
  }

  name = name.replace(/^(?:el|la|los|las)\s+/i, "");

  // 5. Si tiene sufijos de tienda con pipe (|)
  if (name.includes("|")) {
    name = name.split("|")[0].trim();
  }

  // Si tiene guion separando tienda al final (ej. 'Difenac 100mg - Dollder' o 'Loratadina - Farmatodo')
  const storeKeywords = [
    "farmatodo",
    "locatel",
    "farmadon",
    "farmago",
    "farmavida",
    "mercadolibre",
    "amazon",
    "ebay",
    "walmart",
    "dollder",
    "procaps",
    "calox",
  ];
  if (name.includes(" - ")) {
    const parts = name.split(" - ");
    const lastPartLower = parts[parts.length - 1].toLowerCase();
    if (storeKeywords.some((k) => lastPartLower.includes(k)) || parts[parts.length - 1].length < 15) {
      name = parts[0].trim();
    }
  }

  // 6. Acortar si supera los 48 caracteres, cortando limpiamente en el último espacio
  if (name.length > 48) {
    const sub = name.slice(0, 48);
    const lastSpace = sub.lastIndexOf(" ");
    if (lastSpace > 18) {
      name = sub.slice(0, lastSpace).trim();
    } else {
      name = sub.trim();
    }
  }

  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

async function cleanAndCategorizeWithGroq(
  rawText: string
): Promise<{ name: string; categoryId: CategoryId } | null> {
  const aiConfig = (apiConfig as any).global_settings?.ai_cleaner;
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || aiConfig?.api_key;

  if (!aiConfig?.enabled || !apiKey) {
    console.warn("[GroqAI] Omitiendo limpieza por IA: ai_cleaner está deshabilitado o falta la api_key en .env/configuración.");
    return null;
  }

  try {
    console.log(`[GroqAI] Enviando texto a limpiar (${rawText.slice(0, 45)}...)...`);
    const response = await fetchWithRetryAndTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiConfig.model || "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `Eres catalogador farmacéutico en LatAm. Recibes un título/texto crudo escaneado.
Devuelve SOLO un JSON con 2 claves:
1. "name": Nombre comercial en Title Case. DEBE INCLUIR SIEMPRE: principio activo/marca + concentración (ej. 100mg, 500ml) + presentación/cantidad (ej. 10 Comprimidos, Caja x 30 Tabletas). Elimina tiendas (Farmatodo, Locatel), "Descripción", "Comprar" y párrafos enciclopédicos.
Ejemplos: "Difenac Diclofenac Sódico 100 mg x 10 Comprimidos", "Loratadina 10 mg x 10 Tabletas", "Metformina 850 mg Caja x 30 Tabletas", "Jarabe Jengimiel 120 ml", "Alcohol Isopropílico 500 ml".
2. "categoryId": Uno entre: "comida", "bebida", "medicamentos", "insumos_medicos", "ropa", "juguetes". Fármaco -> "medicamentos". Alcohol/gasa/jeringa -> "insumos_medicos".`,
            },
            { role: "user", content: rawText },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      },
      5.0,
      1,
      1.5
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Sin cuerpo de error");
      console.error(`[GroqAI] Falló petición a Groq (HTTP ${response.status}): ${errorBody}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.name && parsed.categoryId) {
          return {
            name: parsed.name.trim(),
            categoryId: parsed.categoryId as CategoryId,
          };
        } else {
          console.warn("[GroqAI] El JSON devuelto no contiene las claves 'name' o 'categoryId':", parsed);
        }
      } catch (parseErr) {
        console.error("[GroqAI] Error al parsear JSON devuelto por Groq:", content, parseErr);
      }
    } else {
      console.warn("[GroqAI] Groq respondió con un content vacío o estructura incorrecta:", data);
    }
  } catch (error: any) {
    console.error("[GroqAI] Excepción / Timeout en la llamada a Groq Cloud:", error?.message || error);
  }
  return null;
}

async function queryWebSearchFallback(barcodeCandidate: string): Promise<ApiProductMatch | null> {
  try {
    const response = await fetchWithRetryAndTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(barcodeCandidate)}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
      },
      8.0,
      1,
      1.5,
    );

    if (!response.ok) return null;
    const html = await response.text();

    // Intentar extraer PRIMERO el título de la página (result__a), ya que los snippets suelen ser párrafos largos
    const titleMatch =
      html.match(/<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/i) ||
      html.match(/<h2 class="result__title">\s*<a[^>]*>([\s\S]*?)<\/a>/i) ||
      html.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

    if (titleMatch && titleMatch[1]) {
      const rawExtractedText = titleMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

      // 1. Intentar primero con la IA en la nube (Groq Llama 3.1) en ~150ms
      const aiResult = await cleanAndCategorizeWithGroq(rawExtractedText);
      if (aiResult) {
        console.log(`[GroqAI] IA limpió producto con éxito: "${aiResult.name}" [${aiResult.categoryId}]`);
        return {
          name: aiResult.name,
          categoryId: aiResult.categoryId,
          barcode: barcodeCandidate,
          sourceApi: "web_search_fallback",
        };
      }

      // 2. Respaldo local si la IA estuviese deshabilitada o sin red
      const cleanTitle = cleanAndSummarizeProductName(rawExtractedText);

      if (cleanTitle.length > 3 && !/^\d+$/.test(cleanTitle)) {
        const lower = cleanTitle.toLowerCase();
        let cat: CategoryId = "comida";
        if (
          lower.includes("mg") ||
          lower.includes("ml") ||
          lower.includes("tab") ||
          lower.includes("caps") ||
          lower.includes("jarabe") ||
          lower.includes("loratadina") ||
          lower.includes("metformina") ||
          lower.includes("eutirox") ||
          lower.includes("paracetamol") ||
          lower.includes("ibuprofeno") ||
          lower.includes("acetaminofen") ||
          lower.includes("farmac") ||
          lower.includes("tableta") ||
          lower.includes("comprimido") ||
          lower.includes("difenac") ||
          lower.includes("diclofenac") ||
          lower.includes("aflamax")
        ) {
          cat = "medicamentos";
        } else if (
          lower.includes("gasa") ||
          lower.includes("jeringa") ||
          lower.includes("guante") ||
          lower.includes("cateter") ||
          lower.includes("quirurgic") ||
          lower.includes("alcohol") ||
          lower.includes("desinfect") ||
          lower.includes("sanitiz") ||
          lower.includes("limpi") ||
          lower.includes("algodon") ||
          lower.includes("venda")
        ) {
          cat = "insumos_medicos";
        } else if (
          lower.includes("talla") ||
          lower.includes("camisa") ||
          lower.includes("pantalon") ||
          lower.includes("zapato")
        ) {
          cat = "ropa";
        }

        return {
          name: cleanTitle,
          categoryId: cat,
          barcode: barcodeCandidate,
          sourceApi: "web_search_fallback",
        };
      }
    }
  } catch (error) {
    console.warn(`[BarcodeSearch] Falló búsqueda web de Nivel 3 para candidato ${barcodeCandidate}:`, error);
  }
  return null;
}

const inFlightSearches = new Map<string, Promise<ApiProductMatch[]>>();

export async function searchBarcodePublicApis(barcode: string): Promise<ApiProductMatch[]> {
  const cleanBarcode = barcode.trim().replace(/[- ]/g, "");

  if (inFlightSearches.has(cleanBarcode)) {
    console.log(`[BarcodeSearch] Petición en curso o reciente detectada para ${cleanBarcode}, evitando duplicado...`);
    return inFlightSearches.get(cleanBarcode)!;
  }

  const searchPromise = (async () => {
    const candidates = getBarcodeCandidates(cleanBarcode);
    const apis = apiConfig.apis || {};

    const authorizedApis = Object.entries(apis).filter(([_, definition]) => {
      return shouldQueryApi(cleanBarcode, (definition as any).routing_rules);
    });

    // Nivel 1: APIs 100% abiertas sin límite diario de peticiones
    const tier1Apis = authorizedApis.filter(([_, def]) => !(def as any).rate_limiting);
    // Nivel 2: APIs con cuotas de uso (ej. upcitemdb_trial) como respaldo final
    const tier2Apis = authorizedApis.filter(([_, def]) => !!(def as any).rate_limiting);

    // En Nivel 1, consultamos TODAS las APIs con TODOS los candidatos (12 y 13 dígitos) en simultáneo
    const tier1Promises: Promise<ApiProductMatch | null>[] = [];
    for (const [key, def] of tier1Apis) {
      for (const candidate of candidates) {
        tier1Promises.push(querySingleApiWithCandidate(key, def, candidate));
      }
    }

    const tier1Results = await Promise.all(tier1Promises);
    let validResults = tier1Results.filter((r): r is ApiProductMatch => r !== null && !!r.name);

    // Si las APIs sin límite no arrojaron ninguna coincidencia, consultamos las APIs con cuota (Nivel 2)
    if (validResults.length === 0 && tier2Apis.length > 0) {
      console.log("[BarcodeSearch] Sin coincidencias en Nivel 1. Consultando APIs de Nivel 2 (con cuota)...");
      for (const [key, def] of tier2Apis) {
        for (const candidate of candidates) {
          const match = await querySingleApiWithCandidate(key, def, candidate);
          if (match && match.name) {
            validResults.push(match);
            break; // Detenemos los candidatos para proteger la cuota
          }
        }
      }
    }

    // Nivel 3: Si Niveles 1 y 2 fallan, realizamos búsqueda web ligera HTML para catálogos locales/farmacias de LatAm
    if (validResults.length === 0) {
      console.log("[BarcodeSearch] Sin coincidencias en Niveles 1 y 2. Consultando Nivel 3 (Búsqueda Web)...");
      for (const candidate of candidates) {
        const match = await queryWebSearchFallback(candidate);
        if (match && match.name) {
          validResults.push(match);
          break;
        }
      }
    }

    // Deduplicación y normalización final inteligente
    const uniqueMatches: ApiProductMatch[] = [];
    const seenNames = new Set<string>();

    for (const match of validResults) {
      if (match.sourceApi !== "web_search_fallback") {
        match.name = cleanAndSummarizeProductName(match.name);
      }
      if (!match.name || match.name.length < 3) continue;

      const normalized = match.name.toLowerCase().trim();
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        uniqueMatches.push(match);
      }
    }

    return uniqueMatches;
  })();

  inFlightSearches.set(cleanBarcode, searchPromise);

  try {
    return await searchPromise;
  } finally {
    setTimeout(() => {
      inFlightSearches.delete(cleanBarcode);
    }, 4000);
  }
}
