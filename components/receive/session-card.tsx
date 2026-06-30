import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import type { ReceiveSession } from "@/types/receive";

type ReceiveSessionCardProps = {
  session: ReceiveSession;
  onPress: () => void;
};

export function ReceiveSessionCard({ session, onPress }: ReceiveSessionCardProps) {
  const isActive = session.status === "in_progress";
  const closedLabel = session.closedAt
    ? new Date(session.closedAt).toLocaleString()
    : null;

  return (
    <Pressable
      className="rounded-2xl border border-amber-200 bg-white p-4 active:opacity-90"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-acopio-muted">
            {isActive ? "Recepción en curso" : "Recepción confirmada"}
          </Text>
          <Text className="mt-1 text-lg font-bold text-acopio-text">
            Placa: {session.plate}
          </Text>
          <Text className="mt-1 text-sm text-acopio-muted">
            {session.boxes.length} caja{session.boxes.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            {isActive
              ? `Iniciada ${new Date(session.createdAt).toLocaleString()}`
              : closedLabel}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#52796F" />
      </View>
    </Pressable>
  );
}
