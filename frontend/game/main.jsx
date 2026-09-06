import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './game.css';

const rootElement = document.getElementById('metacasquette-game-app');

if (rootElement) {
  createRoot(rootElement).render(<App rootElement={rootElement} />);
}
