import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import type { ReceiveSession } from "@/types/receive";

type ReceiveActiveSessionCardProps = {
  session: ReceiveSession;
  onContinue: () => void;
  onDelete: () => void;
};

export function ReceiveActiveSessionCard({
  session,
  onContinue,
  onDelete,
}: ReceiveActiveSessionCardProps) {
  return (
    <View className="rounded-2xl border border-amber-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-acopio-muted">
            Recepción en curso
          </Text>
          <Text className="mt-1 text-base font-bold text-acopio-text">
            Placa: {session.plate}
          </Text>
          <Text className="mt-1 text-sm text-acopio-muted">
            {session.boxes.length} caja{session.boxes.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            {new Date(session.updatedAt).toLocaleString()}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Eliminar recepción"
          className="rounded-xl border border-red-200 p-2"
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={20} color="#9B2226" />
        </Pressable>
      </View>

      <Pressable
        className="mt-3 items-center rounded-xl bg-amber-700 py-2.5 active:opacity-90"
        onPress={onContinue}
      >
        <Text className="font-semibold text-white">Revisar recepción</Text>
      </Pressable>
    </View>
  );
}
