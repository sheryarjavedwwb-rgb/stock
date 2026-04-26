import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("React: Version", "19.0.0");
console.log("App: Initializing entry point...");

const container = document.getElementById('root');
if (container) {
  console.log("App: Root container found, rendering...");
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error("App: Critical failure - Root container not found in DOM.");
}
