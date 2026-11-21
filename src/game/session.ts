export type Session = {
  booted: boolean;
  loggedIn: boolean;
  loginAt?: string;
  pendingFrom?: string;
};

const KEY = 'odw.session.v1';
const EMPTY: Session = { booted: false, loggedIn: false };

let memory: Session = { ...EMPTY };

function sanitize(value: unknown): Session {
  if (!value || typeof value !== 'object') return { ...EMPTY };
  const raw = value as Record<string, unknown>;
  return {
    booted: raw.booted === true,
    loggedIn: raw.loggedIn === true,
    loginAt: typeof raw.loginAt === 'string' ? raw.loginAt : undefined,
    pendingFrom: typeof raw.pendingFrom === 'string' ? raw.pendingFrom : undefined,
  };
}

export function loadSession(): Session {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return { ...memory };
    memory = sanitize(JSON.parse(raw));
    return { ...memory };
  } catch {
    return { ...memory };
  }
}

export function saveSession(next: Session): Session {
  memory = { ...next };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // sessionStorage can be unavailable; memory keeps the ritual working.
  }
  return { ...memory };
}

export function updateSession(patch: Partial<Session>): Session {
  return saveSession({ ...loadSession(), ...patch });
}

export function resetSession(): Session {
  return saveSession({ ...EMPTY });
}