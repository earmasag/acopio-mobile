import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROLES } from "@/constants/modes";
import { validateCentroAcopio } from "@/lib/acopio-api";
import { useSettingsStore } from "@/stores/settings-store";

export default function HomeScreen() {
  const router = useRouter();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const centroAcopioId = useSettingsStore((s) => s.centroAcopioId);
  const campName = useSettingsStore((s) => s.campName);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setCentroAcopioId = useSettingsStore((s) => s.setCentroAcopioId);

  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Mostrar el modal automáticamente si no hay hash configurado
  useEffect(() => {
    if (hydrated && !centroAcopioId) {
      setInputValue("");
      setErrorMsg("");
      setShowModal(true);
    }
  }, [hydrated, centroAcopioId]);

  async function handleSaveHash() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    setIsValidating(true);
    setErrorMsg("");
    
    const result = await validateCentroAcopio(trimmed);
    setIsValidating(false);
    
    if (result.valid) {
      void setCentroAcopioId(trimmed, result.campName);
      setShowModal(false);
    } else {
      setErrorMsg("Código de centro no reconocido o inactivo.");
    }
  }

  function handleEditHash() {
    setInputValue(centroAcopioId);
    setErrorMsg("");
    setShowModal(true);
  }

  const shortHash = centroAcopioId.length > 12
    ? `${centroAcopioId.slice(0, 12)}…`
    : centroAcopioId;

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-1 px-5 pb-8 pt-4">
        {/* Encabezado */}
        <View className="mb-8 overflow-hidden rounded-3xl bg-acopio-accent px-6 py-7 shadow-sm">
          <View className="mb-3 self-start rounded-full bg-white/15 px-3 py-1">
            <Text className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Emergencia
            </Text>
          </View>
          <Text className="text-3xl font-bold text-white">Acopio QR's</Text>
          <Text className="mt-2 text-base leading-6 text-white/80">
            Trazabilidad de donaciones con etiquetas QR
          </Text>
        </View>

        {/* Badge del Centro de Acopio */}
        <Pressable
          className="mb-6 flex-row items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 active:bg-emerald-50"
          onPress={handleEditHash}
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <MaterialIcons name="home-work" size={22} color="#1B4332" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-acopio-muted">
              Centro de Acopio
            </Text>
            {centroAcopioId ? (
              <>
                <Text className="mt-0.5 font-mono text-sm font-bold text-acopio-text">
                  {shortHash}
                </Text>
                {campName ? (
                  <Text className="text-xs text-emerald-700 font-medium">
                    {campName}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text className="mt-0.5 text-sm italic text-red-500">
                Sin configurar — toca para ingresar
              </Text>
            )}
          </View>
          <MaterialIcons
            name={centroAcopioId ? "edit" : "add-circle-outline"}
            size={20}
            color="#52796F"
          />
        </Pressable>

        <Text className="mb-4 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Modo de operación
        </Text>

        {/* Roles */}
        <View className="gap-3">
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              className={`flex-row items-center gap-4 rounded-2xl border p-4 shadow-sm active:opacity-90 ${role.cardClass}`}
              onPress={() => router.push(role.route)}
            >
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${role.iconClass}`}
              >
                <MaterialIcons name={role.icon} size={24} color="#FFFFFF" />
              </View>

              <View className="flex-1">
                <Text className="text-lg font-bold text-acopio-text">
                  {role.title}
                </Text>
                <Text className="mt-0.5 text-sm leading-5 text-acopio-muted">
                  {role.description}
                </Text>
              </View>

              <MaterialIcons name="chevron-right" size={24} color="#52796F" />
            </Pressable>
          ))}
        </View>

        <Text className="mt-auto pt-8 text-center text-xs text-acopio-muted">
          Selecciona el rol según la tarea que realizarás en campo
        </Text>
      </View>

      {/* Modal para ingresar hash de Centro de Acopio */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6">
            <Text className="text-xl font-bold text-acopio-text">
              Centro de Acopio
            </Text>
            <Text className="mt-1 mb-5 text-sm leading-5 text-acopio-muted">
              Ingresa el código de tu centro de acopio. Pídeselo al coordinador.
            </Text>

            <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
              Código de Centro
            </Text>
            <TextInput
              className="mb-5 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 font-mono text-base text-acopio-text"
              placeholder="Ej. centro-ucab-1"
              value={inputValue}
              onChangeText={setInputValue}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isValidating}
              autoFocus
            />

            {errorMsg ? (
              <Text className="mb-4 text-sm text-red-500">
                {errorMsg}
              </Text>
            ) : null}

            <View className="flex-row gap-3">
              {centroAcopioId ? (
                <Pressable
                  className="flex-1 items-center rounded-xl border border-gray-300 py-3"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="font-semibold text-acopio-muted">
                    Cancelar
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                className={`items-center rounded-xl py-3 ${centroAcopioId ? "flex-1" : "w-full"} ${isValidating ? "bg-emerald-400" : "bg-emerald-700"}`}
                onPress={handleSaveHash}
                disabled={isValidating}
              >
                <Text className="font-semibold text-white">
                  {isValidating ? "Validando..." : "Guardar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
