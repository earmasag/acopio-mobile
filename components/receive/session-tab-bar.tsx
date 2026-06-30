import { Pressable, ScrollView, Text, View } from "react-native";

import type { ReceiveSession } from "@/types/receive";

type ReceiveSessionTabBarProps = {
  sessions: ReceiveSession[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
};

export function getReceiveSessionTabLabel(session: ReceiveSession): string {
  return session.plate;
}

export function ReceiveSessionTabBar({
  sessions,
  selectedSessionId,
  onSelect,
}: ReceiveSessionTabBarProps) {
  if (sessions.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-acopio-muted">
        Recepciones en curso ({sessions.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          return (
            <Pressable
              key={session.id}
              className={`rounded-full border px-4 py-2 ${
                isSelected
                  ? "border-amber-700 bg-amber-700"
                  : "border-amber-200 bg-white"
              }`}
              onPress={() => onSelect(session.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? "text-white" : "text-acopio-text"
                }`}
              >
                {getReceiveSessionTabLabel(session)}
              </Text>
              {session.boxes.length > 0 && (
                <Text
                  className={`text-center text-xs ${
                    isSelected ? "text-white/80" : "text-acopio-muted"
                  }`}
                >
                  {session.boxes.length} caja{session.boxes.length === 1 ? "" : "s"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
