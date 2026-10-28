// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// A szerveralkalmazás belépési pontja, adatbázis-kapcsolat és API végpontok konfigurálása

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Útvonalak beimportálása
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/service');
const staffRoutes = require('./routes/staff');
const bookingRoutes = require('./routes/booking');

// Express alkalmazás inicializálása
const app = express();

// Globális köztesrétegek (Middleware) beállítása
app.use(cors());
app.use(express.json());

// MongoDB adatbázis-kapcsolat felépítése
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Sikeres csatlakozás a MongoDB adatbázishoz!'))
  .catch((err) => console.log('Hiba az adatbázis csatlakozásakor:', err));

// API útvonalak csatolása
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);

// HTTP szerver indítása
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`A szerver fut a http://localhost:${PORT} címen...`);
});