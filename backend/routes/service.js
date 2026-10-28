// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Szolgáltatások (Service) kezeléséhez tartozó útvonalak és végpontok

const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const auth = require('../middleware/authMiddleware');

// [POST] Új szolgáltatás rögzítése az adatbázisban
router.post('/', auth, async (req, res) => {
    try {
        const { name, duration, price, description, requiresStaff } = req.body;

        // Új szolgáltatás példányosítása a hitelesített szolgáltató azonosítójával
        const newService = new Service({
            companyId: req.user.userId,
            name,
            duration,
            price,
            description,
            requiresStaff: requiresStaff !== undefined ? requiresStaff : true
        });

        const savedService = await newService.save();

        res.status(201).json({
            message: 'A szolgáltatás sikeresen rögzítve.',
            service: savedService
        });
    } catch (error) {
        res.status(500).json({ message: 'Kiszolgálóoldali hiba a szolgáltatás mentése során.', error: error.message });
    }
});

// [GET] Egy adott szolgáltatóhoz tartozó összes szolgáltatás lekérdezése
router.get('/company/:companyId', async (req, res) => {
    try {
        const services = await Service.find({ companyId: req.params.companyId });
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Hiba a szolgáltatások lekérdezésekor.', error: error.message });
    }
});

// [DELETE] Szolgáltatás törlése azonosító alapján
router.delete('/:id', auth, async (req, res) => {
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
        if (!deletedService) {
            return res.status(404).json({ message: 'A szolgáltatás nem található.' });
        }
        res.status(200).json({ message: 'Szolgáltatás sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a törlés során.', error: error.message });
    }
});

// [PUT] Szolgáltatás adatainak módosítása azonosító alapján
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedService) {
            return res.status(404).json({ message: 'A szolgáltatás nem található.' });
        }
        res.status(200).json({ message: 'Szolgáltatás sikeresen frissítve.', service: updatedService });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a frissítés során.', error: error.message });
    }
});

module.exports = router;