import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import type { PackOrder } from "@/types/pack";
import { shortUuid } from "@/types/pack";

type PackOrderCardProps = {
  order: PackOrder;
  onContinue: () => void;
  onDelete: () => void;
  onPark?: () => void;
};

export function PackOrderCard({
  order,
  onContinue,
  onDelete,
  onPark,
}: PackOrderCardProps) {
  return (
    <View className="rounded-2xl border border-emerald-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-acopio-muted">
            Paquete en curso
          </Text>
          <Text className="mt-1 text-base font-bold text-acopio-text">
            Caja: {shortUuid(order.packageUuid)}
          </Text>
          <Text className="mt-1 text-sm text-acopio-muted">
            {order.items.length} artículo
            {order.items.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            {new Date(order.updatedAt).toLocaleString()}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Eliminar paquete"
          className="rounded-xl border border-red-200 p-2"
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={20} color="#9B2226" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          className="flex-1 items-center rounded-xl bg-emerald-700 py-2.5 active:opacity-90"
          onPress={onContinue}
        >
          <Text className="font-semibold text-white">Continuar</Text>
        </Pressable>
        {onPark && (
          <Pressable
            className="items-center justify-center rounded-xl border border-emerald-200 px-4 py-2.5"
            onPress={onPark}
          >
            <MaterialIcons name="archive" size={20} color="#1B4332" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
