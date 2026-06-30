import { create } from "zustand";

import {
  loadClosedSessions,
  loadInProgressSessions,
  saveClosedSessions,
  saveInProgressSessions,
} from "@/lib/receive-session-storage";
import {
  createReceiveSession,
  createReceivedBox,
  isValidPlate,
  type ReceiveSession,
} from "@/types/receive";

type ReceiveSessionStore = {
  hydrated: boolean;
  inProgressSessions: ReceiveSession[];
  closedSessions: ReceiveSession[];
  focusedSessionId: string | null;
  hydrate: () => Promise<void>;
  getSession: (sessionId: string) => ReceiveSession | undefined;
  focusSession: (sessionId: string) => void;
  createSession: (plate: string) => ReceiveSession | null;
  addBox: (sessionId: string, packageUuid: string) => boolean;
  removeBox: (sessionId: string, boxId: string) => void;
  closeSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
};

function touch(session: ReceiveSession): ReceiveSession {
  return { ...session, updatedAt: new Date().toISOString() };
}

export const useReceiveSessionStore = create<ReceiveSessionStore>((set, get) => ({
  hydrated: false,
  inProgressSessions: [],
  closedSessions: [],
  focusedSessionId: null,

  hydrate: async () => {
    const [inProgressSessions, closedSessions] = await Promise.all([
      loadInProgressSessions(),
      loadClosedSessions(),
    ]);
    set({
      inProgressSessions,
      closedSessions,
      focusedSessionId: inProgressSessions[0]?.id ?? null,
      hydrated: true,
    });
  },

  getSession: (sessionId) => {
    const { inProgressSessions, closedSessions } = get();
    return (
      inProgressSessions.find((session) => session.id === sessionId) ??
      closedSessions.find((session) => session.id === sessionId)
    );
  },

  focusSession: (sessionId) => {
    if (!get().getSession(sessionId)) return;
    set({ focusedSessionId: sessionId });
  },

  createSession: (plate) => {
    if (!isValidPlate(plate)) return null;

    const session = createReceiveSession(plate);
    const next = [session, ...get().inProgressSessions];
    set({ inProgressSessions: next, focusedSessionId: session.id });
    void saveInProgressSessions(next);
    return session;
  },

  addBox: (sessionId, packageUuid) => {
    const { inProgressSessions } = get();
    const index = inProgressSessions.findIndex(
      (session) => session.id === sessionId,
    );
    if (index === -1) return false;

    const session = inProgressSessions[index];
    const normalized = packageUuid.trim();
    if (!normalized) return false;

    if (
      session.boxes.some(
        (box) => box.packageUuid.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      return false;
    }

    const nextSession = touch({
      ...session,
      boxes: [...session.boxes, createReceivedBox(normalized)],
    });
    const next = [...inProgressSessions];
    next[index] = nextSession;
    set({ inProgressSessions: next, focusedSessionId: sessionId });
    void saveInProgressSessions(next);
    return true;
  },

  removeBox: (sessionId, boxId) => {
    const { inProgressSessions } = get();
    const index = inProgressSessions.findIndex(
      (session) => session.id === sessionId,
    );
    if (index === -1) return;

    const nextSession = touch({
      ...inProgressSessions[index],
      boxes: inProgressSessions[index].boxes.filter((box) => box.id !== boxId),
    });
    const next = [...inProgressSessions];
    next[index] = nextSession;
    set({ inProgressSessions: next, focusedSessionId: sessionId });
    void saveInProgressSessions(next);
  },

  closeSession: async (sessionId) => {
    const { inProgressSessions, closedSessions, focusedSessionId } = get();
    const session = inProgressSessions.find((entry) => entry.id === sessionId);
    if (!session) return;

    const nextInProgress = inProgressSessions.filter(
      (entry) => entry.id !== sessionId,
    );
    const closedSession: ReceiveSession = {
      ...session,
      status: "closed",
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextClosed = [closedSession, ...closedSessions];

    set({
      inProgressSessions: nextInProgress,
      closedSessions: nextClosed,
      focusedSessionId:
        focusedSessionId === sessionId
          ? (nextInProgress[0]?.id ?? null)
          : focusedSessionId,
    });
    await saveInProgressSessions(nextInProgress);
    await saveClosedSessions(nextClosed);
  },

  deleteSession: async (sessionId) => {
    const { inProgressSessions, closedSessions, focusedSessionId } = get();
    const nextInProgress = inProgressSessions.filter(
      (entry) => entry.id !== sessionId,
    );
    const nextClosed = closedSessions.filter((entry) => entry.id !== sessionId);

    set({
      inProgressSessions: nextInProgress,
      closedSessions: nextClosed,
      focusedSessionId:
        focusedSessionId === sessionId
          ? (nextInProgress[0]?.id ?? null)
          : focusedSessionId,
    });
    await saveInProgressSessions(nextInProgress);
    await saveClosedSessions(nextClosed);
  },
}));
