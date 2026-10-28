// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Munkatársak (Staff) kezeléséhez tartozó útvonalak és végpontok

const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const auth = require('../middleware/authMiddleware');

// [POST] Új munkatárs profiljának és munkarendjének rögzítése
router.post('/', auth, async (req, res) => {
    try {
        const { name, services, availability } = req.body;

        const newStaff = new Staff({
            companyId: req.user.userId,
            name,
            services,
            availability
        });

        const savedStaff = await newStaff.save();

        res.status(201).json({
            message: 'Munkatárs profilja sikeresen létrehozva.',
            staff: savedStaff
        });
    } catch (error) {
        res.status(500).json({ message: 'Kiszolgálóoldali hiba a munkatárs rögzítésekor.', error: error.message });
    }
});

// [GET] Egy adott szolgáltatóhoz tartozó összes munkatárs lekérdezése
router.get('/company/:companyId', async (req, res) => {
    try {
        // A munkatársak lekérése a hozzájuk rendelt szolgáltatások adataival együtt
        const staffMembers = await Staff.find({ companyId: req.params.companyId }).populate('services');
        res.status(200).json(staffMembers);
    } catch (error) {
        res.status(500).json({ message: 'Hiba a munkatársak lekérdezésekor.', error: error.message });
    }
});

// [DELETE] Munkatárs törlése azonosító alapján
router.delete('/:id', auth, async (req, res) => {
    try {
        const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
        if (!deletedStaff) {
            return res.status(404).json({ message: 'A munkatárs nem található.' });
        }
        res.status(200).json({ message: 'Munkatárs sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a törlés során.', error: error.message });
    }
});

// [PUT] Munkatárs adatainak és beosztásának módosítása azonosító alapján
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedStaff) {
            return res.status(404).json({ message: 'A munkatárs nem található.' });
        }
        res.status(200).json({ message: 'Munkatárs sikeresen frissítve.', staff: updatedStaff });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a frissítés során.', error: error.message });
    }
});

module.exports = router;