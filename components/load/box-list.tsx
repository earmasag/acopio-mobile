import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Pressable, Text, View } from "react-native";

import { shortUuid } from "@/types/pack";
import type { LoadedBox } from "@/types/load";

type LoadBoxListProps = {
  boxes: LoadedBox[];
  onRemove?: (boxId: string) => void;
  readOnly?: boolean;
};

export function LoadBoxList({ boxes, onRemove, readOnly = false }: LoadBoxListProps) {
  const canRemove = !readOnly && onRemove;

  function handleRemove(box: LoadedBox) {
    if (!canRemove || !onRemove) return;

    Alert.alert(
      "Quitar caja",
      `¿Quitar la caja ${shortUuid(box.packageUuid)} de este viaje?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => onRemove(box.id),
        },
      ],
    );
  }

  if (boxes.length === 0) {
    return (
      <View className="items-center rounded-2xl border border-dashed border-sky-300 bg-white/70 px-6 py-8">
        <MaterialIcons name="inventory-2" size={36} color="#52796F" />
        <Text className="mt-3 text-center text-sm text-acopio-muted">
          {readOnly
            ? "Este viaje no registró cajas."
            : "Aún no hay cajas cargadas. Escanea el QR de cada caja al subirla."}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {boxes.map((box, index) => (
        <View
          key={box.id}
          className="flex-row items-center gap-3 rounded-xl border border-sky-200 bg-white px-3 py-3"
        >
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <Text className="text-sm font-bold text-sky-800">{index + 1}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-acopio-text">
              {shortUuid(box.packageUuid)}
            </Text>
            <Text className="text-xs text-acopio-muted">
              {new Date(box.scannedAt).toLocaleString()}
            </Text>
          </View>
          {canRemove && (
            <Pressable
              accessibilityLabel="Quitar caja del viaje"
              className="h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white"
              onPress={() => handleRemove(box)}
            >
              <MaterialIcons name="close" size={18} color="#9B2226" />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
