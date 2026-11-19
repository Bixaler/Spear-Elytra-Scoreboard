import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/ui.css';
import './styles/overlay.css';
import './styles/control.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element missing');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
