import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-acopio-bg px-6">
      <Text className="mb-2 text-3xl font-bold text-acopio-text">Acopio LPN</Text>
      <Text className="text-center text-base text-acopio-muted">
        Trazabilidad de donaciones en emergencia
      </Text>
    </View>
  );
}
