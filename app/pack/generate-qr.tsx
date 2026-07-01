import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchProductFromAcopioDb } from "@/lib/acopio-api";
import { usePackOrderStore } from "@/stores/pack-order-store";

function generateUniqueBoxId(): string {
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CAJA-${part1}-${part2}`;
}

async function generateVerifiedUniqueBoxId(existingIds: Set<string>): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    const candidate = generateUniqueBoxId();
    if (existingIds.has(candidate)) continue;

    // Verificamos en la base de datos central para asegurarnos que no esté guardado allí
    const dbMatch = await fetchProductFromAcopioDb(candidate);
    if (!dbMatch) {
      existingIds.add(candidate);
      return candidate;
    }
    console.log(`[GenerateQR] El código ${candidate} ya existía en BD central, intentando de nuevo...`);
  }
  return generateUniqueBoxId();
}

export default function PackGenerateQrScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const inProgressOrders = usePackOrderStore((state) => state.inProgressOrders);
  const drafts = usePackOrderStore((state) => state.drafts);
  const createOrder = usePackOrderStore((state) => state.createOrder);
  const setPackageUuid = usePackOrderStore((state) => state.setPackageUuid);
  const focusOrder = usePackOrderStore((state) => state.focusOrder);

  const existingOrder = orderId
    ? inProgressOrders.find((o) => o.id === orderId) ?? drafts.find((o) => o.id === orderId)
    : undefined;

  const [currentQr, setCurrentQr] = useState<string>(() => {
    if (existingOrder?.packageUuid) {
      return existingOrder.packageUuid;
    }
    return generateUniqueBoxId();
  });

  // Opciones de generación múltiple (por defecto 10 etiquetas)
  const [qrCount, setQrCount] = useState<number>(10);
  const [labelsPerPage, setLabelsPerPage] = useState<4 | 6 | 8>(6);
  const [isIdentical, setIsIdentical] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  async function handleGenerateNew() {
    const usedIds = new Set<string>();
    inProgressOrders.forEach((o) => o.packageUuid && usedIds.add(o.packageUuid));
    drafts.forEach((o) => o.packageUuid && usedIds.add(o.packageUuid));

    const newId = await generateVerifiedUniqueBoxId(usedIds);
    setCurrentQr(newId);
    if (orderId && existingOrder) {
      setPackageUuid(orderId, newId);
    }
  }

  function handleStartPacking() {
    if (orderId && existingOrder) {
      if (existingOrder.packageUuid !== currentQr) {
        setPackageUuid(orderId, currentQr);
      }
      focusOrder(orderId);
      router.replace({ pathname: "/pack/tally", params: { orderId } });
    } else {
      const newOrder = createOrder();
      setPackageUuid(newOrder.id, currentQr);
      focusOrder(newOrder.id);
      router.replace({ pathname: "/pack/tally", params: { orderId: newOrder.id } });
    }
  }

  async function handleExportPdf() {
    try {
      setIsGeneratingPdf(true);

      const usedIds = new Set<string>();
      inProgressOrders.forEach((o) => o.packageUuid && usedIds.add(o.packageUuid));
      drafts.forEach((o) => o.packageUuid && usedIds.add(o.packageUuid));

      // Generar la lista de IDs verificados contra la BD
      const ids: string[] = [];
      for (let i = 0; i < qrCount; i++) {
        if (i === 0 || isIdentical) {
          if (i === 0) {
            const dbMatch = await fetchProductFromAcopioDb(currentQr);
            if (dbMatch) {
              const safeId = await generateVerifiedUniqueBoxId(usedIds);
              setCurrentQr(safeId);
              ids.push(safeId);
            } else {
              usedIds.add(currentQr);
              ids.push(currentQr);
            }
          } else {
            ids.push(ids[0]);
          }
        } else {
          const uniqueId = await generateVerifiedUniqueBoxId(usedIds);
          ids.push(uniqueId);
        }
      }

      const dateStr = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Configuración dinámica del CSS según cantidad elegida por página
      const configCss = {
        4: { gap: "10mm", padding: "18px", qrSize: "155px", idSize: "18px", cardWidth: "85%", marginPage: "14mm" },
        6: { gap: "6mm", padding: "12px", qrSize: "125px", idSize: "16px", cardWidth: "90%", marginPage: "12mm" },
        8: { gap: "4.5mm", padding: "8px", qrSize: "100px", idSize: "14px", cardWidth: "92%", marginPage: "10mm" },
      }[labelsPerPage];

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: ${configCss.marginPage}; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              background: #f8fafc; 
              margin: 0; 
              padding: 0; 
              color: #1e293b;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .header h1 { 
              color: #064e3b; 
              margin: 0; 
              font-size: 22px; 
              font-weight: 800;
            }
            .header p { 
              color: #64748b; 
              margin: 4px 0 0; 
              font-size: 12px; 
            }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: ${configCss.gap}; 
              justify-items: center; 
            }
            .label-card {
              background: #ffffff;
              border: 2px solid #34d399;
              border-radius: 12px;
              padding: ${configCss.padding};
              width: ${configCss.cardWidth};
              text-align: center;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .badge {
              background: #065f46;
              color: #ffffff;
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 1.5px;
              padding: 3px 10px;
              border-radius: 9999px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .qr-box {
              border: 2.5px solid #065f46;
              border-radius: 10px;
              padding: 6px;
              display: inline-block;
              background: #ffffff;
            }
            .qr-box img { 
              width: ${configCss.qrSize}; 
              height: ${configCss.qrSize}; 
              display: block; 
            }
            .id-title { 
              color: #64748b; 
              font-size: 8px; 
              font-weight: bold; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              margin-top: 8px; 
            }
            .id-value { 
              color: #064e3b; 
              font-size: ${configCss.idSize}; 
              font-weight: 900; 
              letter-spacing: 1.5px; 
              margin: 2px 0 6px; 
            }
            .footer-note { 
              background: #ecfdf5; 
              color: #065f46; 
              font-size: 8px; 
              font-weight: bold; 
              padding: 4px; 
              border-radius: 4px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Centro de Acopio • Hoja de Etiquetas LPN</h1>
            <p>Generado: ${dateStr} • Total: ${ids.length} etiqueta(s) (${labelsPerPage} por hoja) • ${
              isIdentical && ids.length > 1 ? "Copias Idénticas" : "IDs Únicos"
            }</p>
          </div>
          <div class="grid">
            ${ids
              .map(
                (id) => `
              <div class="label-card">
                <div class="badge">ACOPIO • ETIQUETA LPN</div>
                <div class="qr-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(id)}" />
                </div>
                <div class="id-title">Identificador Único</div>
                <div class="id-value">${id}</div>
                <div class="footer-note">✓ Código escaneable activo</div>
              </div>
            `
              )
              .join("")}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setIsGeneratingPdf(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Hoja de Etiquetas QR (${qrCount} en formato ${labelsPerPage}/hoja)`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Éxito", "Archivo PDF generado correctamente.");
      }
    } catch (error) {
      setIsGeneratingPdf(false);
      console.error("Error generando PDF de etiquetas QR:", error);
      Alert.alert("Error", "No se pudo generar el documento PDF.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-1 px-5 pb-6 pt-3">
        {/* Cabecera */}
        <Pressable
          className="mb-2 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-acopio-text">
          {existingOrder ? "QR Único de Caja" : "Generador de QR para Cajas"}
        </Text>
        <Text className="mt-0.5 text-xs text-acopio-muted">
          Genera documentos PDF para imprimir etiquetas físicas de caja.
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} className="mt-3 flex-1">
          {/* Configuración de Cantidad y Opciones */}
          <View className="mt-1 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">

            <Text className="text-xs font-bold uppercase tracking-wider text-acopio-muted">
              Opciones de Generación PDF
            </Text>

            {/* Selector de Cantidad Total */}
            <View className="mt-2.5 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-acopio-text">Cantidad de etiquetas:</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-emerald-100 active:bg-emerald-200"
                  onPress={() => setQrCount((prev) => Math.max(1, prev - 1))}
                >
                  <MaterialIcons name="remove" size={18} color="#065f46" />
                </Pressable>
                <Text className="w-10 text-center text-base font-bold text-acopio-text">
                  {qrCount}
                </Text>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-emerald-100 active:bg-emerald-200"
                  onPress={() => setQrCount((prev) => Math.min(500, prev + 1))}
                >
                  <MaterialIcons name="add" size={18} color="#065f46" />
                </Pressable>
              </View>
            </View>

            {/* Píldoras sumativas rápidas */}
            <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
              {[5, 10, 25, 50].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => setQrCount((prev) => Math.min(500, prev + num))}
                  className="rounded-lg bg-emerald-50 px-3.5 py-1.5 active:bg-emerald-100"
                >
                  <Text className="text-xs font-bold text-emerald-800">+{num}</Text>
                </Pressable>
              ))}
              {qrCount !== 10 && (
                <Pressable
                  onPress={() => setQrCount(10)}
                  className="rounded-lg bg-gray-100 px-2.5 py-1.5 active:bg-gray-200"
                >
                  <Text className="text-xs font-semibold text-gray-600">Reiniciar (10)</Text>
                </Pressable>
              )}
            </View>

            {/* Selector de Etiquetas por Hoja */}
            <View className="mt-3.5 border-t border-gray-100 pt-3">
              <Text className="text-sm font-semibold text-acopio-text">
                Formato por hoja de impresión:
              </Text>
              <View className="mt-2 flex-row gap-1.5">
                {[
                  { count: 4 as const, label: "4 / Hoja", desc: "Grande (10x12cm)" },
                  { count: 6 as const, label: "6 / Hoja", desc: "Estándar (9x8cm)" },
                  { count: 8 as const, label: "8 / Hoja", desc: "Ahorro (8x6cm)" },
                ].map((opt) => (
                  <Pressable
                    key={opt.count}
                    onPress={() => setLabelsPerPage(opt.count)}
                    className={`flex-1 items-center rounded-xl border p-2 ${
                      labelsPerPage === opt.count
                        ? "border-emerald-600 bg-emerald-700"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        labelsPerPage === opt.count ? "text-white" : "text-emerald-900"
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      className={`mt-0.5 text-[10px] ${
                        labelsPerPage === opt.count ? "text-emerald-100" : "text-emerald-700"
                      }`}
                    >
                      {opt.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Switch para copias vs únicos */}
            {qrCount > 1 && (
              <View className="mt-3.5 border-t border-gray-100 pt-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-acopio-text">
                      {isIdentical
                        ? "📑 Modo: Repetir el mismo código"
                        : "🏷️ Modo: Cajas Nuevas (IDs Diferentes)"}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-acopio-muted">
                      {isIdentical
                        ? `Imprime ${qrCount} copias idénticas del código actual (${currentQr}).`
                        : `Crea un lote de ${qrCount} códigos únicos y diferentes para pegar en cajas distintas.`}
                    </Text>
                  </View>
                  <Switch
                    value={isIdentical}
                    onValueChange={setIsIdentical}
                    trackColor={{ false: "#D1D5DB", true: "#6EE7B7" }}
                    thumbColor={isIdentical ? "#059669" : "#F3F4F6"}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Acciones de Guardar / Exportar */}
          <View className="mt-4 gap-2.5 pb-4">
            {/* Guardar en PDF (Hoja de impresión) */}
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3.5 shadow-sm active:opacity-90"
              onPress={handleExportPdf}
              disabled={isGeneratingPdf}
            >
              <MaterialIcons
                name={isGeneratingPdf ? "hourglass-empty" : "picture-as-pdf"}
                size={20}
                color="#FFFFFF"
              />
              <Text className="text-base font-bold text-white">
                {isGeneratingPdf
                  ? "Generando PDF..."
                  : `Guardar Lote de ${qrCount} en PDF (${labelsPerPage}/hoja)`}
              </Text>
            </Pressable>

            <View className="flex-row gap-2.5">
              {/* Generar otro ID */}
              <Pressable
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white py-3 active:bg-emerald-50"
                onPress={handleGenerateNew}
              >
                <MaterialIcons name="autorenew" size={18} color="#1B4332" />
                <Text className="text-xs font-semibold text-acopio-accent sm:text-sm">
                  Generar Otro ID
                </Text>
              </Pressable>

              {/* Botón principal para iniciar armado */}
              <Pressable
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 shadow-sm active:opacity-90"
                onPress={handleStartPacking}
              >
                <MaterialIcons name="inventory-2" size={18} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white sm:text-sm">
                  {existingOrder ? "Continuar Armado" : "Vincular Caja"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
