import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { KeyboardAwareScrollScreen, KeyboardAwareTextInput } from "@/components/keyboard";

import { ReceiveActionCard } from "@/components/receive/action-card";
import { ReceiveActiveSessionCard } from "@/components/receive/active-session-card";
import { ReceiveSessionTabBar } from "@/components/receive/session-tab-bar";
import { useReceiveSessionStore } from "@/stores/receive-session-store";
import { normalizePlate } from "@/types/receive";

function confirmDeleteSession(onDelete: () => void) {
  Alert.alert(
    "Eliminar recepción",
    "¿Seguro que deseas eliminar esta recepción? Se perderán las cajas escaneadas.",
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ],
  );
}

export default function ReceiveHomeScreen() {
  const router = useRouter();
  const hydrated = useReceiveSessionStore((state) => state.hydrated);
  const inProgressSessions = useReceiveSessionStore(
    (state) => state.inProgressSessions,
  );
  const closedSessions = useReceiveSessionStore((state) => state.closedSessions);
  const hydrate = useReceiveSessionStore((state) => state.hydrate);
  const createSession = useReceiveSessionStore((state) => state.createSession);
  const focusSession = useReceiveSessionStore((state) => state.focusSession);
  const deleteSession = useReceiveSessionStore((state) => state.deleteSession);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [plate, setPlate] = useState("");
  const [plateError, setPlateError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (inProgressSessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }

    const stillExists = inProgressSessions.some(
      (session) => session.id === selectedSessionId,
    );
    if (!stillExists) {
      setSelectedSessionId(inProgressSessions[0].id);
    }
  }, [inProgressSessions, selectedSessionId]);

  const selectedSession =
    inProgressSessions.find((session) => session.id === selectedSessionId) ??
    null;

  function openSessionDetail(sessionId: string) {
    focusSession(sessionId);
    router.push({ pathname: "/receive/session", params: { sessionId } });
  }

  function openScanBox(sessionId: string) {
    focusSession(sessionId);
    router.push({ pathname: "/receive/scan-box", params: { sessionId } });
  }

  function handleNewSession() {
    const normalized = normalizePlate(plate);
    if (!normalized) {
      setPlateError("La placa del vehículo es obligatoria");
      return;
    }

    const session = createSession(normalized);
    if (!session) {
      setPlateError("Ingresa una placa válida");
      return;
    }

    setPlateError(null);
    setPlate("");
    setSelectedSessionId(session.id);
    openSessionDetail(session.id);
  }

  if (!hydrated) {
    return (
      <KeyboardAwareScrollScreen contentContainerClassName="flex-1 items-center justify-center px-5">
        <Text className="text-acopio-muted">Cargando…</Text>
      </KeyboardAwareScrollScreen>
    );
  }

  return (
    <KeyboardAwareScrollScreen contentContainerClassName="px-5 pb-8 pt-4">
        <Pressable
          className="mb-4 flex-row items-center gap-1 self-start"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B4332" />
          <Text className="text-sm font-semibold text-acopio-accent">
            Volver al inicio
          </Text>
        </Pressable>

        <View className="mb-6 overflow-hidden rounded-3xl bg-amber-700 px-6 py-6 shadow-sm">
          <Text className="mt-1 text-2xl font-bold text-white">Recepción</Text>
        </View>

        {inProgressSessions.length > 0 && (
          <View className="mb-6 gap-3">
            <ReceiveSessionTabBar
              sessions={inProgressSessions}
              selectedSessionId={selectedSessionId}
              onSelect={setSelectedSessionId}
            />
            {selectedSession && (
              <ReceiveActiveSessionCard
                session={selectedSession}
                onContinue={() => openSessionDetail(selectedSession.id)}
                onDelete={() =>
                  confirmDeleteSession(() =>
                    void deleteSession(selectedSession.id),
                  )
                }
              />
            )}
          </View>
        )}

        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Iniciar recepción
        </Text>

        <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
          Placa del vehículo *
        </Text>
        <KeyboardAwareTextInput
          className="mb-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-acopio-text"
          placeholder="Ej. ABC-123"
          value={plate}
          onChangeText={(value) => {
            setPlate(value.toUpperCase());
            if (plateError) setPlateError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {plateError && (
          <Text className="mb-3 text-sm text-red-700">{plateError}</Text>
        )}
        {!plateError && <View className="mb-3" />}

        <View className="gap-3">
          <ReceiveActionCard
            title="Nueva recepción"
            description="Registra la llegada del camión con su placa"
            icon="move-to-inbox"
            iconClass="bg-amber-700"
            onPress={handleNewSession}
          />
          {selectedSession && (
            <ReceiveActionCard
              title="Escanear caja"
              description={`Confirma cajas de la placa ${selectedSession.plate}`}
              icon="qr-code-scanner"
              iconClass="bg-amber-700"
              onPress={() => openScanBox(selectedSession.id)}
            />
          )}
          {closedSessions.length > 0 && (
            <ReceiveActionCard
              title="Recepciones confirmadas"
              description={`${closedSessions.length} registro${closedSessions.length === 1 ? "" : "s"} para revisar`}
              icon="history"
              iconClass="bg-amber-900"
              onPress={() => router.push("/receive/history")}
            />
          )}
        </View>
    </KeyboardAwareScrollScreen>
  );
}
