import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScreen, KeyboardAwareTextInput } from "@/components/keyboard";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import {
  GARMENT_SIZES,
  GARMENT_TYPES,
  getGarmentLabel,
  isValidShoeSize,
  usesNumericShoeSize,
  type GarmentTypeId,
} from "@/constants/clothing";
import {
  searchBarcodePublicApis,
  validateBarcode,
  type ApiProductMatch,
} from "@/lib/barcode-api";
import { usePackOrderStore } from "@/stores/pack-order-store";

export default function ScanBarcodeScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();

  const addManualItem = usePackOrderStore((state) => state.addManualItem);

  const isProcessingRef = useRef<boolean>(false);
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);
  const [matches, setMatches] = useState<ApiProductMatch[]>([]);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  function resetScanner() {
    isProcessingRef.current = false;
    setScanned(false);
    setCurrentBarcode(null);
  }

  // Registro manual rápido
  const [regName, setRegName] = useState("");
  const [regCategory, setRegCategory] = useState<CategoryId>("comida");
  const [regGarmentType, setRegGarmentType] = useState<GarmentTypeId>("camisa");
  const [regCustomGarment, setRegCustomGarment] = useState("");
  const [regSize, setRegSize] = useState<string>("M");
  const [regError, setRegError] = useState<string | null>(null);

  const isClothing = regCategory === "ropa";
  const isShoeSize = isClothing && usesNumericShoeSize(regGarmentType);

  if (!orderId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="mb-4 text-center text-acopio-muted">
          No se encontró el paquete activo para registrar el artículo.
        </Text>
        <Pressable
          className="rounded-xl bg-emerald-700 px-6 py-3"
          onPress={() => router.replace("/pack")}
        >
          <Text className="font-semibold text-white">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="text-acopio-muted">Preparando cámara…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-acopio-bg px-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-center text-base text-acopio-text">
            Necesitamos acceso a la cámara para escanear el código de barras del producto.
          </Text>
          <Pressable
            className="rounded-xl bg-emerald-700 px-6 py-3"
            onPress={requestPermission}
          >
            <Text className="font-semibold text-white">Permitir cámara</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text className="text-emerald-700">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleProcessBarcode(rawCode: string) {
    if (scanned || searching || isProcessingRef.current) return;
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    isProcessingRef.current = true;
    const validation = validateBarcode(trimmed);
    if (!validation.isValid) {
      setScanned(true);
      Alert.alert("Código no estándar", `${validation.message}\n¿Deseas intentar buscarlo de todos modos?`, [
        { text: "Cancelar", style: "cancel", onPress: () => resetScanner() },
        {
          text: "Buscar igual",
          onPress: () => {
            void executeLookup(trimmed);
          },
        },
      ]);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void executeLookup(trimmed);
  }

  async function executeLookup(barcode: string) {
    setScanned(true);
    setSearching(true);
    setCurrentBarcode(barcode);
    setSuccessBanner(null);

    try {
      const results = await searchBarcodePublicApis(barcode);
      setSearching(false);

      if (results.length === 1) {
        const match = results[0];
        await addManualItem(orderId!, {
          categoryId: match.categoryId,
          name: match.name,
          quantity: 1,
          barcode,
          source: "scan",
        });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessBanner(`✅ Agregado: ${match.name}`);
        setTimeout(() => {
          setSuccessBanner(null);
          resetScanner();
        }, 1600);
      } else if (results.length > 1) {
        setMatches(results);
        setShowMultipleModal(true);
      } else {
        Alert.alert(
          "Artículo no encontrado",
          `El código ${barcode} no arrojó resultados en las APIs comunitarias. ¿Deseas registrar este artículo manualmente?`,
          [
            {
              text: "Reintentar escaneo",
              style: "cancel",
              onPress: () => resetScanner(),
            },
            {
              text: "Registrar artículo",
              onPress: () => {
                setRegName("");
                setRegError(null);
                setShowRegisterModal(true);
              },
            },
          ],
        );
      }
    } catch (err) {
      setSearching(false);
      Alert.alert("Error de red", "Ocurrió un problema al consultar las APIs públicas.", [
        { text: "OK", onPress: () => resetScanner() },
      ]);
    }
  }

  async function handleSelectMatch(match: ApiProductMatch) {
    if (!orderId || !currentBarcode) return;
    await addManualItem(orderId, {
      categoryId: match.categoryId,
      name: match.name,
      quantity: 1,
      barcode: currentBarcode,
      source: "scan",
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMultipleModal(false);
    setMatches([]);
    setSuccessBanner(`✅ Agregado: ${match.name}`);
    setTimeout(() => {
      setSuccessBanner(null);
      resetScanner();
    }, 1500);
  }

  function buildClothingName(): string | null {
    const prendaLabel =
      regGarmentType === "otro" ? regCustomGarment.trim() : getGarmentLabel(regGarmentType);
    if (!prendaLabel) return null;
    const normalizedSize = regSize.trim();
    if (!normalizedSize) return null;
    if (usesNumericShoeSize(regGarmentType) && !isValidShoeSize(normalizedSize)) {
      return null;
    }
    return `${prendaLabel} · ${normalizedSize}`;
  }

  async function handleRegisterSubmit() {
    if (!orderId || !currentBarcode) return;

    if (isClothing) {
      if (usesNumericShoeSize(regGarmentType) && !isValidShoeSize(regSize)) {
        setRegError("Ingresa el talle numérico del calzado");
        return;
      }
      const clothingName = buildClothingName();
      if (!clothingName) {
        setRegError("Completa la prenda y su talla");
        return;
      }
      await addManualItem(orderId, {
        categoryId: regCategory,
        name: clothingName,
        quantity: 1,
        barcode: currentBarcode,
        source: "scan",
        garmentType: regGarmentType,
        size: regSize.trim(),
      });
    } else {
      const trimmed = regName.trim();
      if (!trimmed) {
        setRegError("Ingresa el nombre del artículo");
        return;
      }
      await addManualItem(orderId, {
        categoryId: regCategory,
        name: trimmed,
        quantity: 1,
        barcode: currentBarcode,
        source: "scan",
      });
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRegisterModal(false);
    setSuccessBanner("✅ Artículo registrado y agregado");
    setTimeout(() => {
      setSuccessBanner(null);
      resetScanner();
    }, 1500);
  }

  return (
    <KeyboardAwareScreen className="flex-1 bg-black">
      <View className="flex-1">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code39", "code128", "pdf417", "qr"],
          }}
          onBarcodeScanned={
            scanned
              ? undefined
              : ({ data }) => {
                  void handleProcessBarcode(data);
                }
          }
        />

        <View className="absolute inset-x-0 top-0 bg-black/60 px-5 pb-4 pt-3">
          <Pressable onPress={() => router.back()} className="self-start py-2">
            <Text className="font-semibold text-white">← Volver al paquete</Text>
          </Pressable>
          <Text className="text-lg font-bold text-white">Escanear código de barras</Text>
          <Text className="text-sm text-white/80">
            Apunta al código EAN, UPC o ISBN del producto
          </Text>
        </View>

        {searching && (
          <View className="absolute inset-0 items-center justify-center bg-black/70 px-6">
            <View className="items-center rounded-2xl bg-white p-6 shadow-xl">
              <ActivityIndicator size="large" color="#1B4332" />
              <Text className="mt-4 font-bold text-acopio-text">Consultando APIs públicas...</Text>
              <Text className="mt-1 text-xs text-acopio-muted">Código: {currentBarcode}</Text>
            </View>
          </View>
        )}

        {successBanner && (
          <View className="absolute inset-x-5 top-28 rounded-2xl bg-emerald-700 p-4 shadow-lg">
            <Text className="text-center font-bold text-white">{successBanner}</Text>
          </View>
        )}
      </View>

      <View className="gap-3 bg-white px-5 py-4">
        <Text className="text-sm font-semibold text-acopio-muted">
          Entrada manual / simulador de pruebas
        </Text>
        <View className="flex-row gap-2">
          <KeyboardAwareTextInput
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-base text-acopio-text"
            placeholder="Ej. 7591002000011 o 9780140328721"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <Pressable
            className="items-center justify-center rounded-xl bg-emerald-700 px-5 active:opacity-90"
            onPress={() => {
              if (manualBarcode.trim()) {
                void handleProcessBarcode(manualBarcode.trim());
              }
            }}
          >
            <Text className="font-semibold text-white">Buscar</Text>
          </Pressable>
        </View>
      </View>

      {/* Modal para Selección Múltiple */}
      <Modal visible={showMultipleModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-white px-6 pb-8 pt-6">
            <Text className="text-xl font-bold text-acopio-text">Múltiples resultados</Text>
            <Text className="mt-1 text-sm text-acopio-muted">
              Se encontraron {matches.length} coincidencias para el código {currentBarcode}. Elige la correcta:
            </Text>

            <ScrollView className="my-4 max-h-80">
              <View className="gap-3">
                {matches.map((match, idx) => (
                  <Pressable
                    key={`${match.sourceApi}-${idx}`}
                    className="flex-row items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 active:bg-emerald-100/50"
                    onPress={() => void handleSelectMatch(match)}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-bold text-acopio-text">{match.name}</Text>
                      {match.brand && (
                        <Text className="text-sm text-acopio-muted">Marca: {match.brand}</Text>
                      )}
                      <Text className="mt-1 text-xs font-semibold text-emerald-800 uppercase">
                        Fuente: {match.sourceApi}
                      </Text>
                    </View>
                    <Text className="font-bold text-emerald-700">Elegir →</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl border border-gray-300 py-3"
                onPress={() => {
                  setShowMultipleModal(false);
                  setMatches([]);
                  resetScanner();
                }}
              >
                <Text className="font-semibold text-acopio-muted">Cancelar</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-emerald-700 py-3"
                onPress={() => {
                  setShowMultipleModal(false);
                  setMatches([]);
                  setRegName("");
                  setShowRegisterModal(true);
                }}
              >
                <Text className="font-semibold text-white">Ninguno, registrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Registro Rápido */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <ScrollView contentContainerClassName="grow justify-end">
            <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6">
              <Text className="text-xl font-bold text-acopio-text">Registrar nuevo artículo</Text>
              <Text className="mt-1 mb-4 text-sm text-acopio-muted">
                Código escaneado: <Text className="font-bold">{currentBarcode}</Text>
              </Text>

              <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
                Categoría
              </Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const sel = cat.id === regCategory;
                  return (
                    <Pressable
                      key={cat.id}
                      className={`rounded-full border px-3 py-2 ${
                        sel ? "border-emerald-700 bg-emerald-700" : "border-emerald-200 bg-acopio-bg"
                      }`}
                      onPress={() => {
                        setRegCategory(cat.id);
                        setRegError(null);
                      }}
                    >
                      <Text className={`text-sm font-medium ${sel ? "text-white" : "text-acopio-text"}`}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {isClothing ? (
                <>
                  <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">Prenda</Text>
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {GARMENT_TYPES.map((g) => {
                      const sel = g.id === regGarmentType;
                      return (
                        <Pressable
                          key={g.id}
                          className={`rounded-full border px-3 py-2 ${
                            sel ? "border-emerald-700 bg-emerald-700" : "border-emerald-200 bg-acopio-bg"
                          }`}
                          onPress={() => {
                            setRegGarmentType(g.id);
                            if (usesNumericShoeSize(g.id)) setRegSize("");
                            else setRegSize("M");
                          }}
                        >
                          <Text className={`text-sm font-medium ${sel ? "text-white" : "text-acopio-text"}`}>
                            {g.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {regGarmentType === "otro" && (
                    <KeyboardAwareTextInput
                      className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
                      placeholder="Nombre de la prenda"
                      value={regCustomGarment}
                      onChangeText={setRegCustomGarment}
                    />
                  )}

                  <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
                    {isShoeSize ? "Talle numérico" : "Talla"}
                  </Text>
                  {isShoeSize ? (
                    <KeyboardAwareTextInput
                      className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
                      placeholder="Ej. 42"
                      value={regSize}
                      onChangeText={(val) => setRegSize(val.replace(/[^\d]/g, ""))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  ) : (
                    <View className="mb-4 flex-row flex-wrap gap-2">
                      {GARMENT_SIZES.map((s) => {
                        const sel = s === regSize;
                        return (
                          <Pressable
                            key={s}
                            className={`min-w-11 items-center rounded-full border px-3 py-2 ${
                              sel ? "border-emerald-700 bg-emerald-700" : "border-emerald-200 bg-acopio-bg"
                            }`}
                            onPress={() => setRegSize(s)}
                          >
                            <Text className={`text-sm font-semibold ${sel ? "text-white" : "text-acopio-text"}`}>
                              {s}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
                    Nombre del artículo
                  </Text>
                  <KeyboardAwareTextInput
                    className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 text-base text-acopio-text"
                    placeholder="Ej. Harina de Maíz 1kg"
                    value={regName}
                    onChangeText={(val) => {
                      setRegName(val);
                      setRegError(null);
                    }}
                  />
                </>
              )}

              {regError && <Text className="mb-3 text-sm text-red-700">{regError}</Text>}

              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 items-center rounded-xl border border-gray-300 py-3"
                  onPress={() => {
                    setShowRegisterModal(false);
                    resetScanner();
                  }}
                >
                  <Text className="font-semibold text-acopio-muted">Cancelar</Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-xl bg-emerald-700 py-3"
                  onPress={() => void handleRegisterSubmit()}
                >
                  <Text className="font-semibold text-white">Guardar en paquete</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAwareScreen>
  );
}
