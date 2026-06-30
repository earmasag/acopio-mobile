import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReceiveActionCard } from "@/components/receive/action-card";
import { ReceiveBoxList } from "@/components/receive/box-list";
import { useReceiveSessionStore } from "@/stores/receive-session-store";

function confirmCloseSession(
  session: { plate: string; boxes: { length: number } },
  onConfirm: () => void,
) {
  if (session.boxes.length === 0) {
    Alert.alert(
      "Recepción incompleta",
      "Agrega al menos una caja antes de confirmar la recepción.",
    );
    return;
  }

  Alert.alert(
    "Confirmar recepción",
    `Placa: ${session.plate}\nCajas registradas: ${session.boxes.length}\n\n¿Confirmas que la recepción está completa? No podrás agregar más cajas después.`,
    [
      { text: "Seguir editando", style: "cancel" },
      { text: "Confirmar recepción", onPress: onConfirm },
    ],
  );
}

function confirmDeleteSession(onDelete: () => void) {
  Alert.alert(
    "Eliminar recepción",
    "Se perderá esta recepción y todas las cajas escaneadas.",
    [
      { text: "Volver", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ],
  );
}

export default function ReceiveSessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const session = useReceiveSessionStore((state) => {
    if (!sessionId) return undefined;
    return (
      state.inProgressSessions.find((entry) => entry.id === sessionId) ??
      state.closedSessions.find((entry) => entry.id === sessionId)
    );
  });
  const focusSession = useReceiveSessionStore((state) => state.focusSession);
  const removeBox = useReceiveSessionStore((state) => state.removeBox);
  const closeSession = useReceiveSessionStore((state) => state.closeSession);
  const deleteSession = useReceiveSessionStore((state) => state.deleteSession);

  if (!sessionId || !session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-acopio-bg px-6">
        <Text className="mb-4 text-center text-acopio-muted">
          No se encontró la recepción
        </Text>
        <Pressable
          className="rounded-xl bg-amber-700 px-6 py-3"
          onPress={() => router.replace("/receive")}
        >
          <Text className="font-semibold text-white">Volver a recepción</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isActive = session.status === "in_progress";
  const resolvedSessionId = sessionId;

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

        <View className="mb-4 rounded-2xl border border-amber-200 bg-white p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase text-acopio-muted">
              Detalle de recepción
            </Text>
            <View
              className={`rounded-full px-3 py-1 ${
                isActive ? "bg-amber-100" : "bg-emerald-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? "text-amber-800" : "text-emerald-800"
                }`}
              >
                {isActive ? "En curso" : "Confirmada"}
              </Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-acopio-text">
            Placa: {session.plate}
          </Text>
          <Text className="mt-2 text-sm text-acopio-muted">
            {session.boxes.length} caja{session.boxes.length === 1 ? "" : "s"}{" "}
            recibidas
          </Text>
          <Text className="mt-1 text-xs text-acopio-muted">
            Creada: {new Date(session.createdAt).toLocaleString()}
          </Text>
          {session.closedAt && (
            <Text className="mt-1 text-xs text-acopio-muted">
              Confirmada: {new Date(session.closedAt).toLocaleString()}
            </Text>
          )}
        </View>

        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Cajas recibidas
        </Text>

        <View className="mb-6">
          <ReceiveBoxList
            boxes={session.boxes}
            readOnly={!isActive}
            onRemove={
              isActive
                ? (boxId) => removeBox(resolvedSessionId, boxId)
                : undefined
            }
          />
        </View>

        {isActive && (
          <View className="gap-3">
            <ReceiveActionCard
              title="Escanear caja"
              description="Sigue confirmando cajas de esta recepción"
              icon="qr-code-scanner"
              iconClass="bg-amber-700"
              onPress={() => {
                focusSession(resolvedSessionId);
                router.push({
                  pathname: "/receive/scan-box",
                  params: { sessionId: resolvedSessionId },
                });
              }}
            />
            <ReceiveActionCard
              title="Confirmar recepción"
              description="Revisa el registro y cierra la recepción"
              icon="check-circle"
              iconClass="bg-amber-800"
              onPress={() =>
                confirmCloseSession(session, () =>
                  void closeSession(resolvedSessionId).then(() =>
                    router.replace("/receive"),
                  ),
                )
              }
            />
            <Pressable
              className="items-center py-2"
              onPress={() =>
                confirmDeleteSession(() =>
                  void deleteSession(resolvedSessionId).then(() =>
                    router.replace("/receive"),
                  ),
                )
              }
            >
              <Text className="text-sm font-semibold text-red-700">
                Eliminar recepción
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
