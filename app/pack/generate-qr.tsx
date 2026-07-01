import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

import { usePackOrderStore } from "@/stores/pack-order-store";

function generateUniqueBoxId(): string {
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CAJA-${part1}-${part2}`;
}

export default function PackGenerateQrScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const viewShotRef = useRef<any>(null);

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

  function handleGenerateNew() {
    const newId = generateUniqueBoxId();
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

  async function handleShareQr() {
    if (!viewShotRef.current?.capture) return;
    try {
      const fileUri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: `Guardar o Compartir Etiqueta de ${currentQr}`,
        });
      } else {
        Alert.alert("Éxito", "Imagen capturada y guardada correctamente.");
      }
    } catch (error) {
      console.error("Error al capturar/compartir etiqueta QR:", error);
      Alert.alert("Error", "No se pudo capturar o guardar la imagen de la etiqueta.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-1 px-5 pb-8 pt-4">
        {/* Cabecera */}
        <Pressable
          className="mb-4 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>

        <Text className="text-2xl font-bold text-acopio-text">
          {existingOrder ? "QR Único de Caja" : "Generador de QR para Cajas"}
        </Text>
        <Text className="mt-1 text-sm text-acopio-muted">
          Este código identifica de manera única a la caja física en el sistema de acopio.
        </Text>

        {/* Tarjeta completa capturable (ViewShot) */}
        <View className="my-auto items-center">
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1.0 }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              borderWidth: 2,
              borderColor: "#6EE7B7",
              alignItems: "center",
              width: 310,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {/* Encabezado de la etiqueta */}
            <View className="mb-4 rounded-full bg-emerald-800 px-3 py-1">
              <Text className="text-[11px] font-bold tracking-widest text-white">
                ACOPIO • ETIQUETA LPN
              </Text>
            </View>

            {/* Recuadro QR con borde verde */}
            <View className="rounded-2xl border-4 border-emerald-800 p-4 bg-white">
              <QRCode
                value={currentQr}
                size={190}
                color="#0A2F1D"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Textos del identificador */}
            <Text className="mt-4 text-xs font-bold uppercase tracking-wider text-acopio-muted">
              Identificador Único
            </Text>
            <Text selectable className="mt-1 text-2xl font-black tracking-widest text-emerald-900">
              {currentQr}
            </Text>

            {/* Pie de la etiqueta */}
            <View className="mt-3 flex-row items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5">
              <MaterialIcons name="verified" size={15} color="#1B4332" />
              <Text className="text-xs font-medium text-emerald-800">
                Código escaneable activo y único
              </Text>
            </View>
          </ViewShot>
        </View>

        {/* Acciones inferiores */}
        <View className="gap-2.5 pt-3">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 shadow-sm active:opacity-90"
            onPress={handleStartPacking}
          >
            <MaterialIcons name="inventory-2" size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">
              {existingOrder ? "Continuar con este QR" : "Vincular e Iniciar Armado"}
            </Text>
          </Pressable>

          <View className="flex-row gap-2.5">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white py-3 active:bg-emerald-50"
              onPress={handleShareQr}
            >
              <MaterialIcons name="download" size={18} color="#1B4332" />
              <Text className="text-xs font-semibold text-acopio-accent sm:text-sm">
                Guardar Imagen
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white py-3 active:bg-emerald-50"
              onPress={handleGenerateNew}
            >
              <MaterialIcons name="autorenew" size={18} color="#1B4332" />
              <Text className="text-xs font-semibold text-acopio-accent sm:text-sm">
                Generar Otro ID
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
