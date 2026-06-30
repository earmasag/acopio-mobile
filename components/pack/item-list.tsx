import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import { QuantityInput } from "@/components/pack/quantity-input";
import { CATEGORIES, getCategoryLabel } from "@/constants/categories";
import { formatItemLabel, type PackLineItem } from "@/types/pack";

type PackItemListProps = {
  items: PackLineItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onQuantityFocus?: () => void;
};

export function PackItemList({
  items,
  onUpdateQuantity,
  onRemove,
  onQuantityFocus,
}: PackItemListProps) {
  if (items.length === 0) {
    return (
      <View className="items-center rounded-2xl border border-dashed border-emerald-300 bg-white/70 px-6 py-8">
        <MaterialIcons name="inventory-2" size={36} color="#52796F" />
        <Text className="mt-3 text-center text-sm text-acopio-muted">
          Aún no hay artículos. Agrega manualmente por categoría abajo.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {CATEGORIES.map((category) => {
        const categoryItems = items.filter(
          (item) => item.categoryId === category.id,
        );
        if (categoryItems.length === 0) return null;

        return (
          <View
            key={category.id}
            className="rounded-2xl border border-emerald-200 bg-white p-4"
          >
            <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
              {getCategoryLabel(category.id)}
            </Text>
            <View className="gap-2">
              {categoryItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 rounded-xl bg-acopio-bg px-3 py-2"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-acopio-text">
                      {formatItemLabel(item)}
                    </Text>
                    {item.categoryId === "ropa" && item.garmentType && item.size && (
                      <Text className="text-xs text-acopio-muted">
                        Prenda ·{" "}
                        {item.garmentType === "calzado" ? "Talle" : "Talla"}{" "}
                        {item.size}
                      </Text>
                    )}
                    {item.categoryId !== "ropa" && (
                      <Text className="text-xs text-acopio-muted">Manual</Text>
                    )}
                  </View>
                  <QuantityInput
                    compact
                    value={item.quantity}
                    onChange={(quantity) => onUpdateQuantity(item.id, quantity)}
                    onFocus={onQuantityFocus}
                  />
                  <Pressable
                    accessibilityLabel="Eliminar artículo"
                    className="h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white"
                    onPress={() => onRemove(item.id)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color="#9B2226"
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
