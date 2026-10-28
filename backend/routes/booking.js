// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Foglalások (Booking) kezeléséhez tartozó útvonalak és végpontok

const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const auth = require('../middleware/authMiddleware');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const sendBookingStatusEmail = require('../utils/sendEmail');

// [GET] Szabad időpontok lekérése egy adott napra, munkatársra és szolgáltatásra
router.get('/available-slots', async (req, res) => {
    try {
        const { staffId, date, serviceId } = req.query;
        if (!staffId || !date || !serviceId) {
            return res.status(400).json({ message: 'Hiányzó paraméterek.' });
        }

        const staff = await Staff.findById(staffId);
        const service = await Service.findById(serviceId);
        if (!staff || !service) {
            return res.status(404).json({ message: 'Munkatárs vagy szolgáltatás nem található.' });
        }

        // Ellenőrizzük, hogy a munkatárs szabadságon van-e a kiválasztott napon
        const isDayOff = (staff.availability?.daysOff || []).some(
            (d) => d.toISOString().split('T')[0] === date
        );
        if (isDayOff) {
            return res.status(200).json([]);
        }

        // A keresett nap sorszámának meghatározása (0: Vasárnap, 1: Hétfő, ..., 6: Szombat)
        const queryDate = new Date(date);
        const dayOfWeek = queryDate.getDay();

        // A munkatárs aznapi munkaidejének lekérése
        const workDay = staff.availability.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
        if (!workDay) {
            return res.status(200).json([]);
        }

        // Aznapi aktív foglalások lekérdezése az adatbázisból
        const existingBookings = await Booking.find({
            staffId,
            date: date,
            status: { $ne: 'cancelled' }
        });

        let availableSlots = [];
        let currentSlot = new Date(`${date}T${workDay.startTime}:00`);
        const endOfDay = new Date(`${date}T${workDay.endTime}:00`);
        const slotInterval = staff.availability.slotInterval || 30;

        // Időpontok generálása és ütközésvizsgálat a meglévő foglalásokkal
        while (currentSlot < endOfDay) {
            const slotStart = new Date(currentSlot);
            const slotEnd = new Date(currentSlot.getTime() + (service.duration * 60000));

            // Ha a szolgáltatás vége túlnyúlna a munkaidőn, megszakítjuk a ciklust
            if (slotEnd > endOfDay) break;

            // Ütközés ellenőrzése az aznapi foglalásokkal
            const isOverlapping = existingBookings.some(booking => {
                const bStart = new Date(`${date}T${booking.startTime}:00`);
                const bEnd = new Date(`${date}T${booking.endTime}:00`);
                return (slotStart < bEnd && slotEnd > bStart);
            });

            if (!isOverlapping) {
                const timeString = slotStart.toTimeString().substring(0, 5);
                availableSlots.push(timeString);
            }

            // Léptetés a következő időintervallumra
            currentSlot = new Date(currentSlot.getTime() + (slotInterval * 60000));
        }

        res.status(200).json(availableSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba a szabad időpontok számításakor.' });
    }
});

// [POST] Új időpontfoglalás rögzítése a rendszerben
// Publikus végpont, amely regisztrált és vendég ügyfelek számára is elérhető
router.post('/', async (req, res) => {
    try {
        const { companyId, staffId, serviceId, userId, guestData, date, startTime, endTime } = req.body;

        // Új foglalás példányosítása alapértelmezett 'pending' státusszal
        const newBooking = new Booking({
            companyId,
            staffId,
            serviceId,
            userId: userId || null,
            guestData: guestData || null,
            date,
            startTime,
            endTime
        });

        const savedBooking = await newBooking.save();

        res.status(201).json({
            message: 'A foglalás sikeresen rögzítve, adminisztrátori jóváhagyásra vár.',
            booking: savedBooking
        });
    } catch (error) {
        res.status(500).json({ message: 'Kiszolgálóoldali hiba a foglalás mentése során.', error: error.message });
    }
});

// [GET] A hitelesített szolgáltatóhoz tartozó összes foglalás lekérdezése
router.get('/my-bookings', auth, async (req, res) => {
    try {
        // A szolgáltató foglalásainak lekérése a kapcsolódó munkatárs és szolgáltatás adataival
        const bookings = await Booking.find({ companyId: req.user.userId })
            .populate('staffId', 'name')
            .populate('serviceId', 'name duration price');
            
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Hiba a foglalások lekérdezésekor.', error: error.message });
    }
});

// [GET] Bejelentkezett ügyfél saját foglalási előzményeinek lekérése
router.get('/guest-history', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.userId })
            .populate('companyId', 'name')
            .populate('serviceId', 'name price duration')
            .populate('staffId', 'name');
            
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Hiba a foglalási előzmények lekérésekor.', error: error.message });
    }
});

// [PATCH] Foglalás státuszának módosítása és automatikus e-mail értesítés küldése
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        
        // A megadott státuszérték érvényességének ellenőrzése
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Érvénytelen státusz érték.' });
        }

        // Foglalás státuszának frissítése és a referenciák feloldása az e-mail sablonhoz
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: req.params.id },
            { status },
            { new: true } 
        ).populate('serviceId', 'name').populate('staffId', 'name');

        if (!updatedBooking) {
            return res.status(404).json({ message: 'A foglalás nem található.' });
        }

        // Automatikus státuszváltó e-mail kiküldése az ügyfél részére
        const emailAddress = updatedBooking.guestData?.email;
        if (emailAddress) {
            sendBookingStatusEmail({
                toEmail: emailAddress,
                guestName: updatedBooking.guestData?.name || 'Vendégünk',
                serviceName: updatedBooking.serviceId?.name,
                staffName: updatedBooking.staffId?.name,
                date: new Date(updatedBooking.date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }),
                startTime: `${updatedBooking.startTime} - ${updatedBooking.endTime}`,
                status: updatedBooking.status
            });
        }

        res.status(200).json({ message: 'A foglalás státusza frissítve.', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a státusz frissítésekor.', error: error.message });
    }
});

// [DELETE] Foglalás törlése azonosító alapján
router.delete('/:id', auth, async (req, res) => {
    try {
        const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) {
            return res.status(404).json({ message: 'A foglalás nem található.' });
        }
        res.status(200).json({ message: 'Foglalás sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba a törlés során.', error: error.message });
    }
});

module.exports = router;