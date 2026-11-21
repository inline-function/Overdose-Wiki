import { useLocation } from 'react-router-dom';
import { BootScreen } from './BootScreen';
import { ConsentGate } from './ConsentGate';
import { LoginScreen } from './LoginScreen';
import g from './gates.module.css';
import { useCue } from '../../audio/useCue';

export function GateStage() {
  const { pathname } = useLocation();
  useCue(pathname === '/welcome' ? undefined : 'title');
  return (
    <main className={g.gateMain} aria-label="ODW 入口">
      <h1 className="sr-only">
        {pathname === '/welcome' ? '载入 ODW' : pathname === '/consent' ? '事先声明' : 'ODW 登录'}
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