import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import type { LoadTrip } from "@/types/load";

type LoadActiveTripCardProps = {
  trip: LoadTrip;
  onContinue: () => void;
  onDelete: () => void;
};

export function LoadActiveTripCard({
  trip,
  onContinue,
  onDelete,
}: LoadActiveTripCardProps) {
  return (
    <View className="rounded-2xl border border-sky-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-acopio-muted">
            Carga en curso
          </Text>
          <Text className="mt-1 text-base font-bold text-acopio-text">
            Placa: {trip.plate}
          </Text>
          <Text className="mt-1 text-sm text-acopio-muted">
            {trip.boxes.length} caja{trip.boxes.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            {new Date(trip.updatedAt).toLocaleString()}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Eliminar carga"
          className="rounded-xl border border-red-200 p-2"
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={20} color="#9B2226" />
        </Pressable>
      </View>

      <Pressable
        className="mt-3 items-center rounded-xl bg-sky-700 py-2.5 active:opacity-90"
        onPress={onContinue}
      >
        <Text className="font-semibold text-white">Revisar carga</Text>
      </Pressable>
    </View>
  );
}
