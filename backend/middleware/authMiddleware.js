// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Hitelesítési köztesréteg a bejövő HTTP kérések fejlécében található JWT token érvényesítéséhez

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Token kinyerése a kérés Authorization fejlécéből
    const token = req.header('Authorization');

    // 2. Token hiányában a hozzáférés megtagadása
    if (!token) {
        return res.status(401).json({ message: 'Nincs token megadva, a hitelesítés megtagadva.' });
    }

    try {
        // 3. A "Bearer " előtag levágása a token karakterláncról
        const actualToken = token.startsWith('Bearer ') ? token.slice(7, token.length).trimStart() : token;

        // 4. Token dekódolása és ellenőrzése a titkos kulcs segítségével
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        
        // 5. A dekódolt felhasználói adatok csatolása a kérés objektumhoz
        req.user = decoded;
        
        // 6. Vezérlés átadása a következő köztesrétegnek vagy útvonalkezelőnek
        next();
    } catch (error) {
        res.status(401).json({ message: 'Érvénytelen vagy lejárt token.' });
    }
};