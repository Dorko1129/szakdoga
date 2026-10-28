// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Felhasználó (User) entitás adatbázis modellje

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // A felhasználó vagy szolgáltató cég megjelenített neve
    name: {
        type: String,
        required: true
    },
    // Egyedi e-mail cím a bejelentkezéshez és értesítésekhez
    email: {
        type: String,
        required: true,
        unique: true
    },
    // Titkosított jelszó
    password: {
        type: String
    },
    // Kapcsolattartási telefonszám
    phone: {
        type: String,
        default: ''
    },
    // A felhasználó jogosultsági szintje a rendszerben
    role: {
        type: String,
        enum: ['user', 'guest', 'company', 'admin'],
        default: 'user'
    },
    // Szolgáltatói profilhoz tartozó specifikus beállítások
    companySettings: {
        // A szolgáltató cég vagy márka neve
        brandName: { type: String },
        // Egyéni arculati színkód a felhasználói felülethez
        themeColor: { type: String, default: '#00ACC1' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);