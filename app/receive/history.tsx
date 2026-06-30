import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReceiveSessionCard } from "@/components/receive/session-card";
import { useReceiveSessionStore } from "@/stores/receive-session-store";

export default function ReceiveHistoryScreen() {
  const router = useRouter();
  const closedSessions = useReceiveSessionStore((state) => state.closedSessions);

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
          Recepciones confirmadas
        </Text>
        <Text className="mb-6 text-sm text-acopio-muted">
          Revisa el detalle de cada recepción cerrada en este dispositivo.
        </Text>

        {closedSessions.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-amber-300 bg-white px-6 py-10">
            <MaterialIcons name="move-to-inbox" size={40} color="#52796F" />
            <Text className="mt-3 text-center text-acopio-muted">
              Aún no hay recepciones confirmadas
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {closedSessions.map((session) => (
              <ReceiveSessionCard
                key={session.id}
                session={session}
                onPress={() =>
                  router.push({
                    pathname: "/receive/session",
                    params: { sessionId: session.id },
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
