// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Axios HTTP kliens konfiguráció automatikus JWT token csatolással és munkamenet-kezeléssel

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Kimenő kérések elfogása: JWT token hozzáadása az Authorization fejléchez
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Beérkező válaszok elfogása: 401-es jogosultsági hiba esetén automatikus kijelentkeztetés
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Publikus foglalási oldalon és a bejelentkező felületen nem irányítunk át kényszerítve
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/login') && !currentPath.startsWith('/foglalas')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;