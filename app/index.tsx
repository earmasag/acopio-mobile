import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROLES } from "@/constants/modes";

export default function HomeScreen() {
  const router = useRouter();

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
                <Text className="text-xs font-semibold uppercase text-acopio-muted">
                  {role.step}
                </Text>
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
    </SafeAreaView>
  );
}
