import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollScreen, useKeyboardForm } from "@/components/keyboard";
import { AddManualItemForm } from "@/components/pack/add-manual-item-form";
import { PackItemList } from "@/components/pack/item-list";
import { syncPackOrderToBackend } from "@/lib/acopio-api";
import { usePackOrderStore } from "@/stores/pack-order-store";
import { shortUuid, type ManualItemInput, type PackOrder } from "@/types/pack";

export default function PackTallyScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const order = usePackOrderStore((state) =>
    orderId
      ? (state.inProgressOrders.find((entry) => entry.id === orderId) ??
        state.drafts.find((entry) => entry.id === orderId))
      : undefined,
  );
  const focusOrder = usePackOrderStore((state) => state.focusOrder);
  const deleteOrder = usePackOrderStore((state) => state.deleteOrder);
  const addManualItem = usePackOrderStore((state) => state.addManualItem);
  const updateItemQuantity = usePackOrderStore((state) => state.updateItemQuantity);
  const removeItem = usePackOrderStore((state) => state.removeItem);

  if (!orderId || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="mb-4 text-center text-acopio-muted">
          No se encontró el paquete
        </Text>
        <Pressable
          className="rounded-xl bg-emerald-700 px-6 py-3"
          onPress={() => router.replace("/pack")}
        >
          <Text className="font-semibold text-white">Ir al inicio de empaquetado</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const packageId = orderId;

  function confirmDelete() {
    Alert.alert(
      "Eliminar paquete",
      "¿Seguro que deseas eliminar este paquete?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteOrder(packageId).then(() => router.replace("/pack"));
          },
        },
      ],
    );
  }

  function confirmSyncOrder() {
    if (!order) return;
    Alert.alert(
      "Sellar y Sincronizar Caja",
      "¿Deseas registrar esta caja y sus artículos en la base de datos central de Acopio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sincronizar",
          onPress: async () => {
            const result = await syncPackOrderToBackend(order);
            if (result.success) {
              Alert.alert(
                "¡Sincronización Exitosa!",
                "La caja y todos sus artículos fueron enviados y registrados correctamente en la base de datos central."
              );
            } else {
              Alert.alert("Aviso de Sincronización", result.message);
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAwareScrollScreen contentContainerClassName="px-5 pt-4 grow">
      <PackTallyContent
        order={order}
        onBack={() => router.back()}
        onScanBox={() => {
          focusOrder(packageId);
          router.push({
            pathname: "/pack/scan-box",
            params: { orderId: packageId },
          });
        }}
        onScanBarcode={() => {
          focusOrder(packageId);
          router.push({
            pathname: "/pack/scan-barcode",
            params: { orderId: packageId },
          });
        }}
        onDelete={confirmDelete}
        onSyncOrder={confirmSyncOrder}
        onAddItem={(input) => void addManualItem(packageId, input)}
        onUpdateQuantity={(itemId, quantity) => {
          if (quantity < 1) {
            void removeItem(packageId, itemId);
            return;
          }
          void updateItemQuantity(packageId, itemId, quantity);
        }}
        onRemoveItem={(itemId) => void removeItem(packageId, itemId)}
      />
    </KeyboardAwareScrollScreen>
  );
}

type PackTallyContentProps = {
  order: PackOrder;
  onBack: () => void;
  onScanBox: () => void;
  onScanBarcode: () => void;
  onDelete: () => void;
  onSyncOrder: () => void;
  onAddItem: (input: ManualItemInput) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
};

function PackTallyContent({
  order,
  onBack,
  onScanBox,
  onScanBarcode,
  onDelete,
  onSyncOrder,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
}: PackTallyContentProps) {
  const { dismissKeyboard } = useKeyboardForm();

  function handleAddItem(input: ManualItemInput) {
    onAddItem(input);
    dismissKeyboard();
  }

  return (
    <>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable className="flex-row items-center gap-1" onPress={onBack}>
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>
        <Pressable
          className="rounded-xl border border-red-200 p-2"
          onPress={onDelete}
        >
          <MaterialIcons name="delete-outline" size={20} color="#9B2226" />
        </Pressable>
      </View>

      <View className="mb-4 rounded-2xl border border-emerald-200 bg-white p-4">
        <Text className="text-xs font-semibold uppercase text-acopio-muted">
          Paquete en curso
        </Text>
        <Text className="mt-1 text-lg font-bold text-acopio-text">
          Caja: {shortUuid(order.packageUuid)}
        </Text>
        <Text className="mt-1 text-sm text-acopio-muted">
          {order.items.length} artículo
          {order.items.length === 1 ? "" : "s"}
        </Text>
      </View>

      <View className="mb-6 flex-row gap-2">
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white py-3 active:bg-emerald-50"
          onPress={onScanBox}
        >
          <MaterialIcons name="qr-code-scanner" size={18} color="#1B4332" />
          <Text className="text-xs font-semibold text-acopio-accent">
            {order.packageUuid ? "Cambiar QR" : "Vincular QR de Caja"}
          </Text>
        </Pressable>

        <Pressable
          className="flex-[1.2] flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-3 shadow-sm active:opacity-90"
          onPress={onScanBarcode}
        >
          <MaterialIcons name="barcode-reader" size={18} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">
            + Artículo
          </Text>
        </Pressable>
      </View>

      <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
        Contenido del paquete
      </Text>

      <View className="mb-6">
        <PackItemList
          items={order.items}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemoveItem}
        />
      </View>

      <AddManualItemForm onAdd={handleAddItem} />

      {order.items.length > 0 && (
        <View className="mt-6 mb-8">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-800 py-4 shadow-md active:bg-emerald-900"
            onPress={onSyncOrder}
          >
            <MaterialIcons name="cloud-upload" size={22} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">
              Sellar y Sincronizar Caja en Servidor
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
