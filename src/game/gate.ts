import type { Session } from './session';

export type Gate = { to: string };

export function gateFor(
  pathname: string,
  consentOk: boolean,
  session: Session,
): Gate | null {
  if (pathname === '/welcome') {
    if (!session.booted) return null;
    if (!session.loggedIn) return { to: '/login' };
    if (!consentOk) return { to: '/consent' };
    return { to: session.pendingFrom || '/' };
  }

  if (pathname === '/login') {
    if (!session.booted) return { to: '/welcome' };
    if (session.loggedIn) {
      return { to: consentOk ? session.pendingFrom || '/' : '/consent' };
    }
    return null;
  }

  if (pathname === '/consent') {
    if (!session.booted) return { to: '/welcome' };
    if (!session.loggedIn) return { to: '/login' };
    return null;
  }

  if (pathname === '/settings') return null;

  if (!session.booted) return { to: '/welcome' };
  if (!session.loggedIn) return { to: '/login' };
  if (!consentOk) return { to: '/consent' };
  return null;
}