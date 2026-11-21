import { create } from 'zustand';

const TEST_MARKER = 'odw.test.consent';

function initialAccepted(): boolean {
  try {
    if (window.sessionStorage.getItem(TEST_MARKER) === '1') {
      window.sessionStorage.removeItem(TEST_MARKER);
      return true;
    }
  } catch {
    // sessionStorage can be unavailable; default to showing the notice.
  }
  return false;
}

type ConsentStore = {
  accepted: boolean;
  accept: () => void;
  reset: () => void;
};

export const useConsentStore = create<ConsentStore>()((set) => ({
  accepted: initialAccepted(),
  accept: () => set({ accepted: true }),
  reset: () => set({ accepted: false }),
}));