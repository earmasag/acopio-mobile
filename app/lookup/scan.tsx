import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { KeyboardAwareScreen, KeyboardAwareTextInput } from "@/components/keyboard";
import { parsePackageQr } from "@/types/pack";

export default function LookupScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUuid, setManualUuid] = useState("");
  const [scanned, setScanned] = useState(false);

  function assignBox(raw: string) {
    const packageUuid = parsePackageQr(raw);
    if (!packageUuid) {
      setScanned(false);
      return;
    }

    Vibration.vibrate(100);
    // Navigate directly to the detail view
    router.replace(`/lookup/${packageUuid}` as any);
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
            className="rounded-xl bg-purple-600 px-6 py-3"
            onPress={requestPermission}
          >
            <Text className="font-semibold text-white">Permitir cámara</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text className="text-purple-700">Volver</Text>
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
                  setScanned(true);
                  assignBox(data);
                }
          }
        />
        <View className="absolute inset-x-0 top-0 bg-black/50 px-5 pb-4 pt-2">
          <Pressable onPress={() => router.back()} className="self-start py-2">
            <Text className="font-semibold text-white">← Volver</Text>
          </Pressable>
          <Text className="text-lg font-bold text-white">Consultar Caja</Text>
          <Text className="text-sm text-white/80">
            Escanea el QR para ver el contenido de la caja
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
          className="items-center rounded-xl bg-purple-600 py-3 active:opacity-90"
          onPress={() => assignBox(manualUuid)}
        >
          <Text className="font-semibold text-white">Usar UUID</Text>
        </Pressable>
      </View>
    </KeyboardAwareScreen>
  );
}
