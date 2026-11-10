import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('root');
    if (el) {
      createRoot(el).render(<App />);
    }
  });
}
