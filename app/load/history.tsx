import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadTripCard } from "@/components/load/trip-card";
import { useLoadTripStore } from "@/stores/load-trip-store";

export default function LoadHistoryScreen() {
  const router = useRouter();
  const closedTrips = useLoadTripStore((state) => state.closedTrips);

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
          <Text className="text-sm font-semibold text-acopio-accent">Volver</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-acopio-text">
          Cargas enviadas
        </Text>
        <Text className="mb-6 text-sm text-acopio-muted">
          Revisa el detalle de cada manifiesto cerrado en este dispositivo.
        </Text>

        {closedTrips.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-sky-300 bg-white px-6 py-10">
            <MaterialIcons name="local-shipping" size={40} color="#52796F" />
            <Text className="mt-3 text-center text-acopio-muted">
              Aún no hay cargas enviadas
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {closedTrips.map((trip) => (
              <LoadTripCard
                key={trip.id}
                trip={trip}
                onPress={() =>
                  router.push({
                    pathname: "/load/trip",
                    params: { tripId: trip.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
