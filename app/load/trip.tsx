import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadActionCard } from "@/components/load/action-card";
import { LoadBoxList } from "@/components/load/box-list";
import { useLoadTripStore } from "@/stores/load-trip-store";

function confirmSendTrip(
  trip: { plate: string; boxes: { length: number } },
  onSend: () => void,
) {
  if (trip.boxes.length === 0) {
    Alert.alert(
      "Carga incompleta",
      "Agrega al menos una caja antes de enviar la carga.",
    );
    return;
  }

  Alert.alert(
    "Confirmar envío",
    `Placa: ${trip.plate}\nCajas registradas: ${trip.boxes.length}\n\n¿Confirmas que la carga está completa y deseas enviarla? No podrás agregar más cajas después.`,
    [
      { text: "Seguir editando", style: "cancel" },
      { text: "Enviar carga", onPress: onSend },
    ],
  );
}

function confirmDeleteTrip(onDelete: () => void) {
  Alert.alert(
    "Eliminar carga",
    "Se perderá esta carga y todas las cajas escaneadas.",
    [
      { text: "Volver", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ],
  );
}

export default function LoadTripDetailScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const trip = useLoadTripStore((state) => {
    if (!tripId) return undefined;
    return (
      state.inProgressTrips.find((entry) => entry.id === tripId) ??
      state.closedTrips.find((entry) => entry.id === tripId)
    );
  });
  const focusTrip = useLoadTripStore((state) => state.focusTrip);
  const removeBox = useLoadTripStore((state) => state.removeBox);
  const closeTrip = useLoadTripStore((state) => state.closeTrip);
  const deleteTrip = useLoadTripStore((state) => state.deleteTrip);

  if (!tripId || !trip) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="mb-4 text-center text-acopio-muted">
          No se encontró la carga
        </Text>
        <Pressable
          className="rounded-xl bg-sky-700 px-6 py-3"
          onPress={() => router.replace("/load")}
        >
          <Text className="font-semibold text-white">Volver a carga</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isActive = trip.status === "in_progress";
  const resolvedTripId = tripId;

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          className="mb-4 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>

        <View className="mb-4 rounded-2xl border border-sky-200 bg-white p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase text-acopio-muted">
              Detalle de carga
            </Text>
            <View
              className={`rounded-full px-3 py-1 ${
                isActive ? "bg-sky-100" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? "text-sky-800" : "text-emerald-800"
                }`}
              >
                {isActive ? "En curso" : "Enviada"}
              </Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-acopio-text">
            Placa: {trip.plate}
          </Text>
          <Text className="mt-2 text-sm text-acopio-muted">
            {trip.boxes.length} caja{trip.boxes.length === 1 ? "" : "s"} en el
            manifiesto
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            Creado: {new Date(trip.createdAt).toLocaleString()}
          </Text>
          {trip.closedAt && (
            <Text className="mt-1 text-xs text-acopio-muted">
              Enviado: {new Date(trip.closedAt).toLocaleString()}
            </Text>
          )}
        </View>

        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Cajas del viaje
        </Text>

        <View className="mb-6">
          <LoadBoxList
            boxes={trip.boxes}
            readOnly={!isActive}
            onRemove={
              isActive
                ? (boxId) => removeBox(resolvedTripId, boxId)
                : undefined
            }
          />
        </View>

        {isActive && (
          <View className="gap-3">
            <LoadActionCard
              title="Escanear caja"
              description="Sigue agregando cajas a esta carga"
              icon="qr-code-scanner"
              iconClass="bg-sky-700"
              onPress={() => {
                focusTrip(resolvedTripId);
                router.push({
                  pathname: "/load/scan-box",
                  params: { tripId: resolvedTripId },
                });
              }}
            />
            <LoadActionCard
              title="Enviar carga"
              description="Revisa el manifiesto y confirma el envío"
              icon="local-shipping"
              iconClass="bg-sky-800"
              onPress={() =>
                confirmSendTrip(trip, () =>
                  void closeTrip(resolvedTripId).then(() =>
                    router.replace("/load"),
                  ),
                )
              }
            />
            <Pressable
              className="items-center py-2"
              onPress={() =>
                confirmDeleteTrip(() =>
                  void deleteTrip(resolvedTripId).then(() =>
                    router.replace("/load"),
                  ),
                )
              }
            >
              <Text className="text-sm font-semibold text-red-700">
                Eliminar carga
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
