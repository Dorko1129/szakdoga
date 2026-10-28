// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Alkalmazás gyökérkomponens: útválasztás, szerepkör-alapú hozzáférés-vezérlés és dinamikus témakezelés

import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

import Login from './pages/Login';
import Home from './pages/Home';
import Services from './pages/Services';
import Staff from './pages/Staff';
import Bookings from './pages/Bookings';
import PublicBooking from './pages/PublicBooking';
import Profile from './pages/Profile';
import GuestDashboard from './pages/GuestDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent = ({ toggleColorMode, mode }) => {
    const location = useLocation();
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isGuest = user && (user.role === 'user' || user.role === 'guest');

    const hideNavbarPaths = location.pathname.startsWith('/login') || location.pathname.startsWith('/foglalas');
    const showAdminNavbar = !isGuest && !hideNavbarPaths;

    return (
        <>
            {showAdminNavbar && <Navbar toggleColorMode={toggleColorMode} mode={mode} />}
            <Box component="main" sx={{ flexGrow: 1, pb: 6 }}>
                <Routes>
                    {/* Publikus útvonalak */}
                    <Route path="/login" element={<Login toggleColorMode={toggleColorMode} mode={mode} />} />
                    <Route path="/foglalas/:companyId" element={<PublicBooking toggleColorMode={toggleColorMode} mode={mode} />} />
                    
                    {/* Védett útvonalak szolgáltatók számára */}
                    <Route path="/" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Home /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Profile /></ProtectedRoute>} />
                    <Route path="/services" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Services /></ProtectedRoute>} />
                    <Route path="/staff" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Staff /></ProtectedRoute>} />
                    <Route path="/bookings" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Bookings /></ProtectedRoute>} />

                    {/* Védett útvonal regisztrált ügyfelek számára */}
                    <Route path="/vendeg-profil" element={<ProtectedRoute allowedRoles={['user', 'guest', 'company']}><GuestDashboard toggleColorMode={toggleColorMode} mode={mode} /></ProtectedRoute>} />
                </Routes>
            </Box>
            <Footer />
        </>
    );
};

function App() {
    // Téma állapotának betöltése a böngésző helyi tárolójából
    const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

    // Világos és sötét megjelenítési mód közötti váltás
    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: { main: '#2563eb' },
            secondary: { main: '#f97316' },
            background: {
                default: mode === 'light' ? '#f8fafc' : '#0f172a',
                paper: mode === 'light' ? '#ffffff' : '#1e293b',
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: { cursor: 'default' },
                    'input, textarea': { cursor: 'text' }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: { backgroundImage: 'none' },
                    elevation3: { boxShadow: mode === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : '0 4px 6px -1px rgb(0 0 0 / 0.5)' }
                }
            }
        }
    }), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Router>
                    <AppContent toggleColorMode={toggleColorMode} mode={mode} />
                </Router>
            </Box>
        </ThemeProvider>
    );
}

export default App;