// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Védett útvonalakat kezelő komponens JWT token-ellenőrzéssel és szerepkör-alapú jogosultságkezeléssel

import React from 'react';
import { Navigate } from 'react-router-dom';

// Segédfüggvény a JWT token formátumának és lejárati idejének ellenőrzéséhez
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) return false;
        return true;
    } catch (error) {
        return false;
    }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Érvénytelen vagy hiányzó token esetén kijelentkeztetés és átirányítás
    if (!isTokenValid(token) || !userStr) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);
    const userRole = user.role || 'user';

    // Jogosultság ellenőrzése az adott útvonalhoz engedélyezett szerepkörök alapján
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'user' || userRole === 'guest') {
            return <Navigate to="/vendeg-profil" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;