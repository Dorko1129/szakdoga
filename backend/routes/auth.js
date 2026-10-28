// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Autentikációs útvonalak: regisztráció, bejelentkezés és profilkezelés

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const auth = require('../middleware/authMiddleware');

// [POST] Új felhasználó regisztrációja
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // 1. Ellenőrizzük, hogy létezik-e már fiók ezzel az e-mail címmel
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Ez az e-mail cím már regisztrálva van a rendszerben.' });
        }

        // 2. Jelszó titkosítása sózással és hasheléssel
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Jogosultsági szint meghatározása és az új felhasználó példányosítása
        const normalizedRole = role === 'company' ? 'company' : 'user';

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: normalizedRole
        });

        // 4. Adatok mentése az adatbázisba
        await newUser.save();

        // 5. JWT token generálása az azonnali beléptetéshez
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Felhasználó sikeresen regisztrálva!',
            token,
            user: {
                _id: newUser._id,
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Szerverhiba történt a regisztráció során.', error: error.message });
    }
});

// [POST] Bejelentkezés és JWT token generálása
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található ezzel az e-mail címmel.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Hibás hitelesítő adatok.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Sikeres hitelesítés.',
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Kiszolgálóoldali hiba a hitelesítés során.', error: error.message });
    }
});

// [GET] Aktuálisan bejelentkezett felhasználó adatainak lekérése
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'A keresett felhasználói profil nem található.' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Kiszolgálóoldali hiba az adatok lekérése során.', error: error.message });
    }
});

// [PUT] Felhasználói vagy cégprofil adatainak frissítése
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Felhasználó keresése a tokenben tárolt azonosító alapján
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'A felhasználó nem található.' });
        }

        // E-mail cím egyediségének ellenőrzése módosítás esetén
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Ez az e-mail cím már használatban van egy másik fióknál.' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        // Jelszó frissítése új érték megadása esetén
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            message: 'Profil sikeresen frissítve!',
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Profil mentési hiba:', error);
        
        // MongoDB egyedi kulcs (E11000) ütközés kezelése
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ez az e-mail cím már foglalt.' });
        }
        
        res.status(500).json({ message: 'Hiba a profil frissítésekor.' });
    }
});

module.exports = router;