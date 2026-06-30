import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ReceiveSession } from "@/types/receive";

const IN_PROGRESS_SESSIONS_KEY = "@acopio/receive-in-progress-sessions";
const CLOSED_SESSIONS_KEY = "@acopio/receive-closed-sessions";

export async function loadInProgressSessions(): Promise<ReceiveSession[]> {
  const raw = await AsyncStorage.getItem(IN_PROGRESS_SESSIONS_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as ReceiveSession[]).map((session) => ({
    ...session,
    status: "in_progress" as const,
  }));
}

export async function saveInProgressSessions(
  sessions: ReceiveSession[],
): Promise<void> {
  await AsyncStorage.setItem(
    IN_PROGRESS_SESSIONS_KEY,
    JSON.stringify(sessions),
  );
}

export async function loadClosedSessions(): Promise<ReceiveSession[]> {
  const raw = await AsyncStorage.getItem(CLOSED_SESSIONS_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as ReceiveSession[]).map((session) => ({
    ...session,
    status: "closed" as const,
  }));
}

export async function saveClosedSessions(
  sessions: ReceiveSession[],
): Promise<void> {
  await AsyncStorage.setItem(CLOSED_SESSIONS_KEY, JSON.stringify(sessions));
}
