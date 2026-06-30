import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePackOrderStore } from "@/stores/pack-order-store";
import { shortUuid } from "@/types/pack";

export default function PackOrdersScreen() {
  const router = useRouter();
  const drafts = usePackOrderStore((state) => state.drafts);
  const resumeDraft = usePackOrderStore((state) => state.resumeDraft);
  const deleteOrder = usePackOrderStore((state) => state.deleteOrder);

  function confirmDelete(id: string) {
    Alert.alert("Eliminar borrador", "¿Seguro que deseas eliminar este paquete?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => void deleteOrder(id),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-1 px-5 pb-8 pt-4">
        <Pressable
          className="mb-4 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-acopio-text">
          Paquetes guardados
        </Text>
        <Text className="mb-6 text-sm text-acopio-muted">
          Paquetes apartados. Desarchívalos para retomarlos en paquetes en curso.
        </Text>

        {drafts.length === 0 ? (
          <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-white px-6 py-10">
            <MaterialIcons name="folder-off" size={40} color="#52796F" />
            <Text className="mt-3 text-center text-acopio-muted">
              No hay paquetes guardados todavía
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {drafts.map((draft) => (
              <View
                key={draft.id}
                className="rounded-2xl border border-emerald-200 bg-white p-4"
              >
                <Text className="text-xs text-acopio-muted">
                  {new Date(draft.updatedAt).toLocaleString()}
                </Text>
                <Text className="mt-1 font-bold text-acopio-text">
                  Caja: {shortUuid(draft.packageUuid)}
                </Text>
                <Text className="text-sm text-acopio-muted">
                  {draft.items.length} artículos
                </Text>
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 active:opacity-90"
                    onPress={() => void resumeDraft(draft.id)}
                  >
                    <MaterialIcons name="unarchive" size={20} color="#FFFFFF" />
                    <Text className="font-semibold text-white">Desarchivar</Text>
                  </Pressable>
                  <Pressable
                    className="items-center justify-center rounded-xl border border-red-200 px-4 py-2.5"
                    onPress={() => confirmDelete(draft.id)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#9B2226" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
