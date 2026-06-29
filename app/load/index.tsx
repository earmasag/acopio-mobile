import { Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function LoadScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">Modo Carga</Text>
      <Text onPress={() => router.back()} className="text-blue-600">
        ← Volver al inicio
      </Text>
    </View>
  );
}
