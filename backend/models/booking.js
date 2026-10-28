// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Foglalás (Booking) entitás adatbázis modellje

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // A szolgáltatást nyújtó cég azonosítója
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // A kijelölt munkatárs azonosítója
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    // Az igénybe vett szolgáltatás azonosítója
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    // Regisztrált felhasználó esetén a kapcsolódó fiók azonosítója
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Az ügyfél kapcsolattartási adatai
    guestData: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        isRegistered: { type: Boolean, default: false }
    },
    // A foglalás dátuma ÉÉÉÉ-HH-NN formátumban
    date: {
        type: String,
        required: true
    },
    // A foglalás kezdési időpontja ÓÓ:PP formátumban
    startTime: {
        type: String,
        required: true
    },
    // A foglalás befejezési időpontja ÓÓ:PP formátumban
    endTime: {
        type: String,
        required: true
    },
    // A foglalás aktuális státusza
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);