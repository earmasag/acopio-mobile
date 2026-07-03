import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { ROLES } from "@/constants/modes";
import { validateCentroAcopio } from "@/lib/acopio-api";
import { useSettingsStore } from "@/stores/settings-store";

export default function HomeScreen() {
  const router = useRouter();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const centerCode = useSettingsStore((s) => s.centerCode);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setCentroAcopioCredentials = useSettingsStore((s) => s.setCentroAcopioCredentials);

  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Show the modal automatically if no hash is configured
  useEffect(() => {
    if (hydrated && !centerCode) {
      setInputValue("");
      setErrorMsg("");
      setShowModal(true);
    }
  }, [hydrated, centerCode]);

  async function handleSaveHash() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setErrorMsg("You must enter the credentials.");
      return;
    }
    
    const result = await validateCentroAcopio(trimmed);
    setIsValidating(false);
    
    if (result.valid) {
      void setCentroAcopioCredentials(trimmed, result.campName);
      setShowModal(false);
    } else {
      setErrorMsg("Center code not recognized or inactive.");
    }
  }

  function handleEditHash() {
    setInputValue(centerCode);
    setErrorMsg("");
    setShowModal(true);
  }

  function handleLogout() {
    void setCentroAcopioCredentials("");
    setShowModal(false);
  }

  async function handleDownloadQR() {
    if (!centerCode) {
      alert("Configura tu centro de acopio primero.");
      return;
    }
    try {
      const url = `${process.env.EXPO_PUBLIC_API_BASE_URL || "https://acopio-api.onrender.com"}/api/v1/qrcodes/pdf?pages=1`;
      const fileUri = `${FileSystem.documentDirectory}acopio_cajas_qr.pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: "application/pdf",
            dialogTitle: "Etiquetas QR Acopio",
            UTI: "com.adobe.pdf",
          });
        } else {
          alert("Compartir no está disponible en este dispositivo.");
        }
      } else {
        alert("Error al descargar el PDF de QRs.");
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error descargando el archivo.");
    }
  }

  const shortHash = centerCode.length > 12
    ? `${centerCode.slice(0, 12)}…`
    : centerCode;

  return (
    <SafeAreaView className="flex-1 bg-acopio-bg">
      <View className="flex-1 px-5 pb-8 pt-4">
        {/* Header */}
        <View className="mb-8 overflow-hidden rounded-3xl bg-acopio-accent px-6 py-7 shadow-sm">
          <View className="mb-3 self-start rounded-full bg-white/15 px-3 py-1">
            <Text className="text-xs font-semibold uppercase tracking-widest text-white/90">
              Emergency
            </Text>
          </View>
          <Text className="text-3xl font-bold text-white">Acopio QR's</Text>
          <Text className="mt-2 text-base leading-6 text-white/80">
            QR Donation Traceability
          </Text>
        </View>

        {/* Header: Connection Status and Hash */}
        <Pressable
          className="mb-6 flex-row items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm active:bg-emerald-50"
          onPress={handleEditHash}
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <MaterialIcons name="home-work" size={22} color="#1B4332" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-acopio-muted">
              Collection Center
            </Text>
            {centerCode ? (
              <View>
                <Text className="mt-0.5 font-mono text-sm font-bold text-acopio-text">
                  {shortHash}
                </Text>
              </View>
            ) : (
              <Text className="mt-0.5 text-sm italic text-red-500">
                Unconfigured — tap to enter
              </Text>
            )}
          </View>
          <MaterialIcons
            name={centerCode ? "edit" : "add-circle-outline"}
            size={20}
            color="#52796F"
          />
        </Pressable>

        <Text className="mb-4 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Operation Mode
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

        <Text className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wide text-acopio-muted">
          Herramientas
        </Text>
        
        <Pressable
          className="flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100 active:opacity-90"
          onPress={handleDownloadQR}
        >
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <MaterialIcons name="print" size={24} color="#4B5563" />
            </View>
            <View>
              <Text className="text-lg font-bold text-acopio-text">
                Imprimir QRs
              </Text>
              <Text className="text-sm leading-5 text-acopio-muted">
                Descargar e imprimir etiquetas de cajas
              </Text>
            </View>
          </View>
          <MaterialIcons name="download" size={24} color="#52796F" />
        </Pressable>

        <Text className="mt-auto pt-8 text-center text-xs text-acopio-muted">
          Select the role according to the task you will perform in the field
        </Text>
      </View>

      {/* Modal to enter Collection Center hash */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6">
            <Text className="text-xl font-bold text-acopio-text">
              Collection Center
            </Text>
            <Text className="mt-1 mb-5 text-sm leading-5 text-acopio-muted">
              Enter your collection center code. Ask your coordinator.
            </Text>

            <Text className="mb-2 text-xs font-semibold uppercase text-acopio-muted">
              Center Code
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-gray-200 bg-acopio-bg px-4 py-3 font-mono text-base text-acopio-text"
              placeholder="Ej. UCAB-gy-0012"
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
              {centerCode ? (
                <Pressable
                  className="flex-1 items-center rounded-xl border border-red-300 py-3"
                  onPress={handleLogout}
                >
                  <Text className="font-semibold text-red-600">
                    Log out
                  </Text>
                </Pressable>
              ) : null}
              {centerCode ? (
                <Pressable
                  className="flex-1 items-center rounded-xl border border-gray-300 py-3"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="font-semibold text-acopio-muted">
                    Cancel
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                className={`items-center rounded-xl py-3 ${centerCode ? "flex-1" : "w-full"} ${isValidating ? "bg-emerald-400" : "bg-emerald-700"}`}
                onPress={handleSaveHash}
                disabled={isValidating}
              >
                <Text className="font-semibold text-white">
                  {isValidating ? "Validating..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
