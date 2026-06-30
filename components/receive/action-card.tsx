import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type ReceiveActionCardProps = {
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  iconClass: string;
  onPress: () => void;
};

export function ReceiveActionCard({
  title,
  description,
  icon,
  iconClass,
  onPress,
}: ReceiveActionCardProps) {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm active:opacity-90"
      onPress={onPress}
    >
      <View
        className={`h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <MaterialIcons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-acopio-text">{title}</Text>
        <Text className="mt-0.5 text-sm leading-5 text-acopio-muted">
          {description}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#52796F" />
    </Pressable>
  );
}
