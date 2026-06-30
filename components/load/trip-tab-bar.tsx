import { Pressable, ScrollView, Text, View } from "react-native";

import type { LoadTrip } from "@/types/load";

type LoadTripTabBarProps = {
  trips: LoadTrip[];
  selectedTripId: string | null;
  onSelect: (tripId: string) => void;
};

export function getLoadTripTabLabel(trip: LoadTrip): string {
  return trip.plate;
}

export function LoadTripTabBar({
  trips,
  selectedTripId,
  onSelect,
}: LoadTripTabBarProps) {
  if (trips.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-acopio-muted">
        Cargas en curso ({trips.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
        {trips.map((trip) => {
          const isSelected = trip.id === selectedTripId;
          return (
            <Pressable
              key={trip.id}
              className={`rounded-full border px-4 py-2 ${
                isSelected
                  ? "border-sky-700 bg-sky-700"
                  : "border-sky-200 bg-white"
              }`}
              onPress={() => onSelect(trip.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? "text-white" : "text-acopio-text"
                }`}
              >
                {getLoadTripTabLabel(trip)}
              </Text>
              {trip.boxes.length > 0 && (
                <Text
                  className={`text-center text-xs ${
                    isSelected ? "text-white/80" : "text-acopio-muted"
                  }`}
                >
                  {trip.boxes.length} caja{trip.boxes.length === 1 ? "" : "s"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
