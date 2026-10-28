// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// A React kliensalkalmazás belépési pontja és DOM-hoz csatolása

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);