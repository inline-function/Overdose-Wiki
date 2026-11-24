import { useLocation } from 'react-router-dom';
import { BootScreen } from './BootScreen';
import { ConsentGate } from './ConsentGate';
import { LoginScreen } from './LoginScreen';
import g from './gates.module.css';
import { useCue } from '../../audio/useCue';
import { useT } from '../../i18n';

export function GateStage() {
  const { pathname } = useLocation();
  const t = useT();
  useCue(pathname === '/welcome' ? undefined : 'title');
  return (
    <main className={g.gateMain} aria-label={t('gate.srMainLabel')}>
      <h1 className="sr-only">
        {pathname === '/welcome'
          ? t('gate.srWelcome')
          : pathname === '/consent'
            ? t('gate.srConsent')
            : t('gate.srLogin')}
      </h1>
      {pathname === '/welcome' ? (
        <BootScreen />
      ) : pathname === '/consent' ? (
        <ConsentGate />
      ) : (
        <LoginScreen />
      )}
    </main>
  );
}