import { useEffect, useMemo, useState } from 'react';
import { StoreProvider } from './state/store';
import { ConfirmProvider } from './components/ui/Modal';
import { Overlay } from './components/overlay/Overlay';
import { ControlApp } from './components/control/ControlApp';
import { Landing } from './components/landing/Landing';

/**
 * Minimal router supporting BOTH:
 *  - hash routes  → #/overlay, #/control   (primary; works on any static host)
 *  - clean paths  → /overlay,  /control    (honoured when the host serves
 *                                            index.html for them, e.g. vite
 *                                            preview or the bundled 404 shim)
 */

export type Route = 'overlay' | 'control' | 'home';

function resolveRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (hash === 'overlay' || hash === 'control') return hash;

  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  path = path.replace(/^\//, '').replace(/\/+$/, '');
  if (path === 'overlay' || path === 'control') return path;

  return 'home';
}

function Router() {
  const [route, setRoute] = useState<Route>(() => resolveRoute());

  useEffect(() => {
    const onChange = () => setRoute(resolveRoute());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  // Route-scoped document chrome: the overlay page must stay fully
  // transparent with no scrollbars; the app pages paint the identity.
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('route-overlay', route === 'overlay');
    body.classList.toggle('route-app', route !== 'overlay');
    if (route === 'overlay') window.scrollTo(0, 0);
  }, [route]);

  const view = useMemo(() => {
    switch (route) {
      case 'overlay':
        return <Overlay />;
      case 'control':
        return <ControlApp />;
      case 'home':
      default:
        return <Landing />;
    }
  }, [route]);

  return view;
}

export default function App() {
  return (
    <StoreProvider>
      {/* ConfirmProvider must wrap every surface using useConfirm() — without
          it the confirmation dialogs resolve false and resets never run. */}
      <ConfirmProvider>
        <Router />
      </ConfirmProvider>
    </StoreProvider>
  );
}
