import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePackOrderStore } from "@/stores/pack-order-store";
import { parsePackageQr } from "@/types/pack";

export default function ScanBoxScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUuid, setManualUuid] = useState("");
  const [scanned, setScanned] = useState(false);
  const setPackageUuid = usePackOrderStore((state) => state.setPackageUuid);

  function assignBox(raw: string) {
    const packageUuid = parsePackageQr(raw);
    if (!packageUuid || !orderId) return;

    setPackageUuid(orderId, packageUuid);
    router.replace({ pathname: "/pack/tally", params: { orderId } });
  }

  if (!orderId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="mb-4 text-center text-acopio-muted">
          No se encontró el paquete a vincular
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
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={
            scanned
              ? undefined
              : ({ data }) => {
                  setScanned(true);
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
            Apunta al código de la etiqueta LPN
          </Text>
        </View>
      </View>

      <View className="gap-3 bg-white px-5 py-4">
        <Text className="text-sm font-semibold text-acopio-muted">
          Entrada manual (pruebas)
        </Text>
        <TextInput
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
    </SafeAreaView>
  );
}
