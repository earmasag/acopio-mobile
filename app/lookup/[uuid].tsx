import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { fetchPackageDetails } from "@/lib/acopio-api";
import { useSettingsStore } from "@/stores/settings-store";
import type { ApiPackageResponse, PackageItemDetailResponse } from "@/types/lookup";

function getStatusInfo(status: string) {
  switch (status) {
    case "PACKED":
      return { text: "Empacado en Origen", color: "bg-emerald-100 text-emerald-800", icon: "inventory-2" as const };
    case "SEALED":
      return { text: "Sellado en Origen", color: "bg-emerald-100 text-emerald-800", icon: "check-circle" as const };
    case "IN_TRANSIT":
      return { text: "En Tránsito", color: "bg-sky-100 text-sky-800", icon: "local-shipping" as const };
    case "DELIVERED":
      return { text: "Entregado en Destino", color: "bg-amber-100 text-amber-800", icon: "where-to-vote" as const };
    default:
      return { text: status, color: "bg-gray-100 text-gray-800", icon: "info" as const };
  }
}

export default function PackageDetailScreen() {
  const router = useRouter();
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const centerCode = useSettingsStore((s) => s.centerCode);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<ApiPackageResponse | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!uuid || !centerCode) return;
      const res = await fetchPackageDetails(uuid, centerCode);
      if (res.success && res.data) {
        setPkg(res.data);
      } else {
        setError(res.message || "Error al cargar");
      }
      setLoading(false);
    }
    loadData();
  }, [uuid, centerCode]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="mt-4 text-acopio-muted">Buscando información de la caja...</Text>
      </SafeAreaView>
    );
  }

  if (error || !pkg) {
    return (
      <SafeAreaView className="flex-1 bg-acopio-bg">
        <View className="flex-row items-center bg-white px-5 pb-4 pt-4 shadow-sm">
          <Pressable onPress={() => router.back()} className="mr-4">
            <MaterialIcons name="arrow-back" size={24} color="#1B4332" />
          </Pressable>
          <Text className="text-xl font-bold text-acopio-text">Caja no encontrada</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-lg text-red-500">{error}</Text>
          <Pressable 
            className="mt-6 rounded-xl bg-purple-600 px-6 py-3"
            onPress={() => router.replace("/lookup/scan")}
          >
            <Text className="font-semibold text-white">Escanear otra caja</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(pkg.status);
  const dateStr = new Date(pkg.updated_at).toLocaleString();

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-row items-center bg-white px-5 pb-4 pt-4 shadow-sm">
        <Pressable onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="#1B4332" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-acopio-text">Detalle de Caja</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        
        {/* Status Header */}
        <View className="mb-6 items-center rounded-2xl bg-white p-6 shadow-sm">
          <View className={`mb-3 rounded-full p-4 ${statusInfo.color.split(" ")[0]}`}>
            <MaterialIcons name={statusInfo.icon} size={32} className={statusInfo.color.split(" ")[1]} />
          </View>
          <Text className="text-lg font-bold text-acopio-text">Estado Actual</Text>
          <Text className={`mt-1 font-semibold ${statusInfo.color.split(" ")[1]}`}>{statusInfo.text}</Text>
          <Text className="mt-2 text-xs text-acopio-muted">Última actualización: {dateStr}</Text>
        </View>

        {/* Origin / Receiver Info */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-4 text-base font-bold text-acopio-text border-b border-gray-100 pb-2">Información de Manejo</Text>
          
          <View className="mb-3">
            <Text className="text-xs font-semibold uppercase text-acopio-muted">Empacada por</Text>
            <Text className="text-base text-acopio-text">{pkg.packer_name || "Desconocido"}</Text>
          </View>
          
          {pkg.receiver_name && (
            <View>
              <Text className="text-xs font-semibold uppercase text-acopio-muted">Recibida en destino por</Text>
              <Text className="text-base text-acopio-text">{pkg.receiver_name}</Text>
            </View>
          )}
        </View>

        {/* Trip Info */}
        {pkg.trip && (
          <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-purple-100">
            <View className="flex-row items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <MaterialIcons name="local-shipping" size={20} color="#7C3AED" />
              <Text className="text-base font-bold text-acopio-text">Información de Transporte</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-xs font-semibold uppercase text-acopio-muted">Placa</Text>
                <Text className="text-base font-bold text-acopio-text">{pkg.trip.truck_plate}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-semibold uppercase text-acopio-muted">Conductor</Text>
                <Text className="text-base text-acopio-text">{pkg.trip.driver_name}</Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-3 mt-2 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-acopio-muted text-center">Origen</Text>
                <Text className="text-sm font-semibold text-acopio-text text-center">{pkg.trip.origin_camp}</Text>
              </View>
              <MaterialIcons name="arrow-right-alt" size={24} color="#9CA3AF" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-acopio-muted text-center">Destino</Text>
                <Text className="text-sm font-semibold text-acopio-text text-center">{pkg.trip.destination_camp}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Items List */}
        <View className="mb-6 rounded-2xl bg-white shadow-sm overflow-hidden">
          <View className="bg-gray-50 p-4 border-b border-gray-100">
            <Text className="text-base font-bold text-acopio-text">Contenido de la Caja ({pkg.items.length} ítems)</Text>
          </View>
          
          <View className="p-2">
            {pkg.items.map((item, index) => (
              <View key={item.id} className={`flex-row items-center p-3 ${index > 0 ? "border-t border-gray-100" : ""}`}>
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-purple-50 mr-3">
                  <Text className="font-bold text-purple-700">{item.quantity}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-acopio-text">
                    {item.item_name || item.category_name}
                  </Text>
                  
                  {item.item_name && (
                    <Text className="text-xs text-acopio-muted uppercase font-bold mt-0.5">
                      {item.category_name}
                    </Text>
                  )}

                  {item.clothing_detail && (
                    <Text className="text-sm text-acopio-muted mt-0.5">
                      Talla: {item.clothing_detail.size}
                    </Text>
                  )}
                  {item.barcode && !item.clothing_detail && (
                    <Text className="text-xs text-gray-400 font-mono mt-0.5">
                      {item.barcode}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            {pkg.items.length === 0 && (
              <Text className="p-4 text-center italic text-acopio-muted">Esta caja está vacía.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
