import { Pressable, ScrollView, Text, View } from "react-native";

import type { PackOrder } from "@/types/pack";
import { shortUuid } from "@/types/pack";

type OrderTabBarProps = {
  orders: PackOrder[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
};

export function getOrderTabLabel(order: PackOrder, index: number): string {
  if (order.packageUuid) return shortUuid(order.packageUuid);
  return `Paquete ${index + 1}`;
}

export function OrderTabBar({
  orders,
  selectedOrderId,
  onSelect,
}: OrderTabBarProps) {
  if (orders.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-acopio-muted">
        Paquetes en curso ({orders.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
        {orders.map((order, index) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <Pressable
              key={order.id}
              className={`rounded-full border px-4 py-2 ${
                isSelected
                  ? "border-emerald-700 bg-emerald-700"
                  : "border-emerald-200 bg-white"
              }`}
              onPress={() => onSelect(order.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? "text-white" : "text-acopio-text"
                }`}
              >
                {getOrderTabLabel(order, index)}
              </Text>
              {order.items.length > 0 && (
                <Text
                  className={`text-center text-xs ${
                    isSelected ? "text-white/80" : "text-acopio-muted"
                  }`}
                >
                  {order.items.length} ítems
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
