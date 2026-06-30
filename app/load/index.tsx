import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadActionCard } from "@/components/load/action-card";
import { LoadActiveTripCard } from "@/components/load/active-trip-card";
import { LoadTripTabBar } from "@/components/load/trip-tab-bar";
import { normalizePlate } from "@/types/load";
import { useLoadTripStore } from "@/stores/load-trip-store";

function confirmDeleteTrip(onDelete: () => void) {
  Alert.alert(
    "Eliminar carga",
    "¿Seguro que deseas eliminar esta carga? Se perderán las cajas escaneadas.",
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ],
  );
}

export default function LoadHomeScreen() {
  const router = useRouter();
  const hydrated = useLoadTripStore((state) => state.hydrated);
  const inProgressTrips = useLoadTripStore((state) => state.inProgressTrips);
  const closedTrips = useLoadTripStore((state) => state.closedTrips);
  const hydrate = useLoadTripStore((state) => state.hydrate);
  const createTrip = useLoadTripStore((state) => state.createTrip);
  const focusTrip = useLoadTripStore((state) => state.focusTrip);
  const deleteTrip = useLoadTripStore((state) => state.deleteTrip);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [plateError, setPlateError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (inProgressTrips.length === 0) {
      setSelectedTripId(null);
      return;
    }

    const stillExists = inProgressTrips.some(
      (trip) => trip.id === selectedTripId,
    );
    if (!stillExists) {
      setSelectedTripId(inProgressTrips[0].id);
    }
  }, [inProgressTrips, selectedTripId]);

  const selectedTrip =
    inProgressTrips.find((trip) => trip.id === selectedTripId) ?? null;

  function openTripDetail(tripId: string) {
    focusTrip(tripId);
    router.push({ pathname: "/load/trip", params: { tripId } });
  }

  function openScanBox(tripId: string) {
    focusTrip(tripId);
    router.push({ pathname: "/load/scan-box", params: { tripId } });
  }

  function handleNewTrip() {
    const normalized = normalizePlate(plate);
    if (!normalized) {
      setPlateError("La placa del vehículo es obligatoria");
      return;
    }

    const trip = createTrip(normalized);
    if (!trip) {
      setPlateError("Ingresa una placa válida");
      return;
    }

    setPlateError(null);
    setPlate("");
    setSelectedTripId(trip.id);
    openTripDetail(trip.id);
  }

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg">
        <Text className="text-acopio-muted">Cargando…</Text>
      </SafeAreaView>
    );
  }

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
          <Text className="text-sm font-semibold text-acopio-accent">
            Volver al inicio
          </Text>
        </Pressable>

        <View className="mb-6 overflow-hidden rounded-3xl bg-sky-700 px-6 py-6 shadow-sm">
          <Text className="mt-1 text-2xl font-bold text-white">Carga</Text>
        </View>

        {inProgressTrips.length > 0 && (
          <View className="mb-6 gap-3">
            <LoadTripTabBar
              trips={inProgressTrips}
              selectedTripId={selectedTripId}
              onSelect={setSelectedTripId}
            />
            {selectedTrip && (
              <LoadActiveTripCard
                trip={selectedTrip}
                onContinue={() => openTripDetail(selectedTrip.id)}
                onDelete={() =>
                  confirmDeleteTrip(() => void deleteTrip(selectedTrip.id))
                }
              />
            )}
          </View>
        )}

        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Iniciar carga
        </Text>

        <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
          Placa del vehículo *
        </Text>
        <TextInput
          className="mb-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-acopio-text"
          placeholder="Ej. ABC-123"
          value={plate}
          onChangeText={(value) => {
            setPlate(value.toUpperCase());
            if (plateError) setPlateError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {plateError && (
          <Text className="mb-3 text-sm text-red-700">{plateError}</Text>
        )}
        {!plateError && <View className="mb-3" />}

        <View className="gap-3">
          <LoadActionCard
            title="Nueva carga"
            description="Crea un manifiesto con la placa del camión"
            icon="local-shipping"
            iconClass="bg-sky-700"
            onPress={handleNewTrip}
          />
          {selectedTrip && (
            <LoadActionCard
              title="Escanear caja"
              description={`Agrega cajas a la placa ${selectedTrip.plate}`}
              icon="qr-code-scanner"
              iconClass="bg-sky-700"
              onPress={() => openScanBox(selectedTrip.id)}
            />
          )}
          {closedTrips.length > 0 && (
            <LoadActionCard
              title="Cargas enviadas"
              description={`${closedTrips.length} manifiesto${closedTrips.length === 1 ? "" : "s"} para revisar`}
              icon="history"
              iconClass="bg-sky-900"
              onPress={() => router.push("/load/history")}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
