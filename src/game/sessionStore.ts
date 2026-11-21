import { create } from 'zustand';
import { loadSession, resetSession, updateSession, type Session } from './session';

type SessionStore = {
  session: Session;
  patch: (patch: Partial<Session>) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionStore>()((set) => ({
  session: loadSession(),
  patch: (patch) => set({ session: updateSession(patch) }),
  reset: () => set({ session: resetSession() }),
}));