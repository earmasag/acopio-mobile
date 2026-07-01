import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScreen, KeyboardAwareTextInput } from "@/components/keyboard";
import { fetchProductFromAcopioDb } from "@/lib/acopio-api";
import { usePackOrderStore } from "@/stores/pack-order-store";
import { parsePackageQr } from "@/types/pack";

export default function ScanBoxScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUuid, setManualUuid] = useState("");
  const [scanned, setScanned] = useState(false);
  const isProcessingRef = useRef<boolean>(false);

  const inProgressOrders = usePackOrderStore((state) => state.inProgressOrders);
  const drafts = usePackOrderStore((state) => state.drafts);
  const createOrder = usePackOrderStore((state) => state.createOrder);
  const focusOrder = usePackOrderStore((state) => state.focusOrder);
  const setPackageUuid = usePackOrderStore((state) => state.setPackageUuid);

  async function assignBox(raw: string) {
    if (isProcessingRef.current || scanned) return;
    const packageUuid = parsePackageQr(raw);
    if (!packageUuid) return;

    isProcessingRef.current = true;
    setScanned(true);

    try {
      if (!orderId) {
        // Modo A: Escanear caja QR directo desde el inicio
        // Si no escanea y regresa, no hace nada. Si escanea:
        const existingOrder =
          inProgressOrders.find((o) => o.packageUuid === packageUuid) ??
          drafts.find((o) => o.packageUuid === packageUuid);

        if (existingOrder) {
          focusOrder(existingOrder.id);
          router.replace({ pathname: "/pack/tally", params: { orderId: existingOrder.id } });
          return;
        }

        const newOrder = createOrder();
        setPackageUuid(newOrder.id, packageUuid);
        focusOrder(newOrder.id);
        router.replace({ pathname: "/pack/tally", params: { orderId: newOrder.id } });
      } else {
        // Modo B: Escaneado desde un paquete manual / en curso
        // Debe estar sí o sí vacío para evitar colisiones
        const otherOrder =
          inProgressOrders.find((o) => o.id !== orderId && o.packageUuid === packageUuid) ??
          drafts.find((o) => o.id !== orderId && o.packageUuid === packageUuid);

        if (otherOrder && otherOrder.items.length > 0) {
          Alert.alert(
            "Caja No Disponible",
            `El código ${packageUuid} ya tiene artículos en otro paquete local. Debes escanear una caja vacía para evitar colisiones.`,
            [{ text: "Entendido", onPress: () => { isProcessingRef.current = false; setScanned(false); } }]
          );
          return;
        }

        const dbMatch = await fetchProductFromAcopioDb(packageUuid);
        if (dbMatch) {
          Alert.alert(
            "Caja Registrada en Servidor",
            `El código ${packageUuid} ya existe en la base de datos central. Debes escanear una caja vacía para evitar colisiones.`,
            [{ text: "Entendido", onPress: () => { isProcessingRef.current = false; setScanned(false); } }]
          );
          return;
        }

        setPackageUuid(orderId, packageUuid);
        focusOrder(orderId);
        router.replace({ pathname: "/pack/tally", params: { orderId } });
      }
    } catch (e) {
      isProcessingRef.current = false;
      setScanned(false);
    }
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
            Necesitamos acceso a la cámara para escanear el QR de la caja
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

  return (
    <KeyboardAwareScreen className="flex-1 bg-black">
      <View className="flex-1">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={
            scanned
              ? undefined
              : ({ data }) => {
                  assignBox(data);
                }
          }
        />
        <View className="absolute inset-x-0 top-0 bg-black/50 px-5 pb-4 pt-2">
          <Pressable onPress={() => router.back()} className="self-start py-2">
            <Text className="font-semibold text-white">← Volver</Text>
          </Pressable>
          <Text className="text-lg font-bold text-white">Escanear caja QR</Text>
          <Text className="text-sm text-white/80">
            {orderId
              ? "Apunta al código de una caja vacía"
              : "Apunta al código de la etiqueta LPN"}
          </Text>
        </View>
      </View>

      <View className="gap-3 bg-white px-5 py-4">
        <Text className="text-sm font-semibold text-acopio-muted">
          Entrada manual (pruebas)
        </Text>
        <KeyboardAwareTextInput
          className="rounded-xl border border-gray-200 px-4 py-3 text-base text-acopio-text"
          placeholder="UUID de la caja"
          value={manualUuid}
          onChangeText={setManualUuid}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          className="items-center rounded-xl bg-emerald-700 py-3 active:opacity-90"
          onPress={() => assignBox(manualUuid)}
        >
          <Text className="font-semibold text-white">Usar UUID</Text>
        </Pressable>
      </View>
    </KeyboardAwareScreen>
  );
}
