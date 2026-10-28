// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Szolgáltatás (Service) entitás adatbázis modellje

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    // A szolgáltatást nyújtó cég azonosítója
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // A szolgáltatás megnevezése
    name: { 
        type: String, 
        required: true 
    },
    // A szolgáltatás időtartama percben kifejezve
    duration: { 
        type: Number, 
        required: true 
    },
    // A szolgáltatás díja forintban
    price: { 
        type: Number, 
        required: true 
    },
    // Kiegészítő leírás a szolgáltatás részleteiről
    description: { 
        type: String 
    },
    // Jelzi, hogy a foglaláskor kötelező-e munkatársat választani
    requiresStaff: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);