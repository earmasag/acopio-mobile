import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import type { LoadTrip } from "@/types/load";

type LoadTripCardProps = {
  trip: LoadTrip;
  onPress: () => void;
};

export function LoadTripCard({ trip, onPress }: LoadTripCardProps) {
  const isActive = trip.status === "in_progress";
  const closedLabel = trip.closedAt
    ? new Date(trip.closedAt).toLocaleString()
    : null;

  return (
    <Pressable
      className="rounded-2xl border border-sky-200 bg-white p-4 active:opacity-90"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-acopio-muted">
            {isActive ? "Viaje en curso" : "Carga enviada"}
          </Text>
          <Text className="mt-1 text-lg font-bold text-acopio-text">
            Placa: {trip.plate}
          </Text>
          <Text className="mt-1 text-sm text-acopio-muted">
            {trip.boxes.length} caja{trip.boxes.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            {isActive
              ? `Iniciado ${new Date(trip.createdAt).toLocaleString()}`
              : closedLabel}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#52796F" />
      </View>
    </Pressable>
  );
}
