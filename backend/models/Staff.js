// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Munkatárs (Staff) és elérhetőség entitás adatbázis modellje

const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    // A munkáltató cég azonosítója
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // A munkatárs teljes neve
    name: { 
        type: String, 
        required: true 
    },
    // A munkatárs által elvégezhető szolgáltatások azonosítóinak listája
    services: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service' 
    }],
    // Naptár és elérhetőségi konfigurációk
    availability: {
        // Foglalási időközök hossza percben kifejezve
        slotInterval: { type: Number, default: 30 }, 
        
        // Két foglalás közötti szünet hossza percben
        bufferTime: { type: Number, default: 0 }, 
        
        // Heti rendszeres munkaidő-beosztás
        workingHours: [{
            // A hét napjának indexe (0: Vasárnap, 1: Hétfő, ..., 6: Szombat)
            dayOfWeek: { type: Number }, 
            // Napi munkakezdés időpontja ÓÓ:PP formátumban
            startTime: { type: String }, 
            // Napi munkavégzés vége ÓÓ:PP formátumban
            endTime: { type: String }    
        }],
        
        // Egyedi szabadnapok listája, amikor a munkatárshoz nem lehet foglalni
        daysOff: [{ type: Date }] 
    }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);