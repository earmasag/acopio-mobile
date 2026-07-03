import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PackActionCard } from "@/components/pack/action-card";
import { OrderTabBar } from "@/components/pack/order-tab-bar";
import { PackOrderCard } from "@/components/pack/order-card";
import { usePackOrderStore } from "@/stores/pack-order-store";

function confirmDeletePackage(onDelete: () => void) {
  Alert.alert(
    "Eliminar paquete",
    "¿Seguro que deseas eliminar este paquete? Esta acción no se puede deshacer.",
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ],
  );
}

export default function PackHomeScreen() {
  const router = useRouter();
  const hydrated = usePackOrderStore((state) => state.hydrated);
  const inProgressOrders = usePackOrderStore((state) => state.inProgressOrders);
  const drafts = usePackOrderStore((state) => state.drafts);
  const sealedOrders = usePackOrderStore((state) => state.sealedOrders);
  const hydrate = usePackOrderStore((state) => state.hydrate);
  const createOrder = usePackOrderStore((state) => state.createOrder);
  const focusOrder = usePackOrderStore((state) => state.focusOrder);
  const deleteOrder = usePackOrderStore((state) => state.deleteOrder);
  const parkOrderAsDraft = usePackOrderStore((state) => state.parkOrderAsDraft);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (inProgressOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    const stillExists = inProgressOrders.some(
      (order) => order.id === selectedOrderId,
    );
    if (!stillExists) {
      setSelectedOrderId(inProgressOrders[0].id);
    }
  }, [inProgressOrders, selectedOrderId]);

  const selectedOrder =
    inProgressOrders.find((order) => order.id === selectedOrderId) ?? null;

  function openTally(orderId: string) {
    focusOrder(orderId);
    router.push({ pathname: "/pack/tally", params: { orderId } });
  }

  function openScanBox(orderId: string) {
    focusOrder(orderId);
    router.push({ pathname: "/pack/scan-box", params: { orderId } });
  }

  function handleNewOrder() {
    const order = createOrder();
    setSelectedOrderId(order.id);
    openTally(order.id);
  }

  function handleScanNewBox() {
    router.push({ pathname: "/pack/scan-box" });
  }

  function handleGenerateNewBoxQr() {
    router.push("/pack/generate-qr");
  }

  function getSyncStatusIcon(status?: "pending" | "synced" | "error") {
    switch (status) {
      case "synced": return { name: "cloud-done" as const, color: "#10b981", text: "Sincronizada ✓" };
      case "pending": return { name: "cloud-upload" as const, color: "#fbbf24", text: "Sincronizando..." };
      case "error": return { name: "cloud-off" as const, color: "#ef4444", text: "Error de sync, reintentando..." };
      default: return { name: "cloud-queue" as const, color: "#9ca3af", text: "Pendiente" };
    }
  }

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg">
        <Text className="text-acopio-muted">Cargando…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          className="mb-4 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">
            Volver al inicio
          </Text>
        </Pressable>

        <View className="mb-6 overflow-hidden rounded-3xl bg-emerald-800 px-6 py-6 shadow-sm">
          <Text className="mt-1 text-2xl font-bold text-white">
            Empaquetado
          </Text>
        </View>

        {inProgressOrders.length > 0 && (
          <View className="mb-6 gap-3">
            <OrderTabBar
              orders={inProgressOrders}
              selectedOrderId={selectedOrderId}
              onSelect={setSelectedOrderId}
            />
            {selectedOrder && (
              <PackOrderCard
                order={selectedOrder}
                onContinue={() => openTally(selectedOrder.id)}
                onDelete={() =>
                  confirmDeletePackage(() => void deleteOrder(selectedOrder.id))
                }
                onPark={() => void parkOrderAsDraft(selectedOrder.id)}
              />
            )}
          </View>
        )}

        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Iniciar paquete
        </Text>

        <View className="gap-3">
          <PackActionCard
            title="Nuevo paquete"
            description="Crea un paquete y registra los artículos sin QR inicial"
            icon="add-box"
            iconClass="bg-emerald-700"
            onPress={handleNewOrder}
          />
          {/* 
          <PackActionCard
            title="Generar Etiqueta QR"
            description="Crea e imprime un QR único para identificar la caja física"
            icon="qr-code"
            iconClass="bg-emerald-800"
            onPress={handleGenerateNewBoxQr}
          />
          */}
          <PackActionCard
            title="Paquetes guardados"
            description={
              drafts.length > 0
                ? `${drafts.length} paquete${drafts.length === 1 ? "" : "s"} para desarchivar`
                : "Recupera un empaquetado pendiente"
            }
            icon="folder-open"
            iconClass="bg-emerald-900"
            onPress={() => router.push("/pack/orders")}
          />
        </View>

        {sealedOrders.length > 0 && (
          <>
            <Text className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
              Cajas Selladas
            </Text>
            <View className="gap-3">
              {sealedOrders.slice(0, 10).map((order) => {
                const status = getSyncStatusIcon(order.syncStatus);
                const itemsCount = order.items.length;
                
                return (
                  <View
                    key={order.id}
                    className="flex-row items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                      <MaterialIcons name="inventory-2" size={20} color="#4b5563" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-acopio-text">
                        {order.packageUuid ?? "Caja Local"}
                      </Text>
                      <Text className="text-xs text-acopio-muted">
                        {itemsCount} artículo{itemsCount === 1 ? "" : "s"}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-1">
                        <MaterialIcons name={status.name} size={14} color={status.color} />
                        <Text className="text-xs" style={{ color: status.color }}>
                          {status.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
