// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Felső navigációs sáv és sötét/világos témaváltó komponens

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const Navbar = ({ toggleColorMode, mode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = !!localStorage.getItem('token');

    // Kijelentkezés: munkamenet adatainak törlése és átirányítás a bejelentkező oldalra
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // A publikus foglalási felületen a navigációs sáv elrejtése
    if (location.pathname.startsWith('/foglalas')) return null;

    return (
        <AppBar position="static" color="inherit" elevation={1} sx={{ bgcolor: 'background.paper' }}>
            <Toolbar>
                <Typography variant="h6" color="primary" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Időpontfoglaló
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={toggleColorMode} color="inherit" sx={{ mr: 2 }}>
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>

                    {isAuthenticated ? (
                        <>
                            <Button color="inherit" component={Link} to="/">Kezdőlap</Button>
                            <Button color="inherit" component={Link} to="/services">Szolgáltatások</Button>
                            <Button color="inherit" component={Link} to="/staff">Munkatársak</Button>
                            <Button color="inherit" component={Link} to="/bookings">Foglalások</Button>
                            <Button color="inherit" component={Link} to="/profile">Profil</Button>
                            <Button color="error" variant="outlined" sx={{ ml: 2 }} onClick={handleLogout}>
                                Kijelentkezés
                            </Button>
                        </>
                    ) : (
                        <Button color="primary" variant="contained" component={Link} to="/login">
                            Bejelentkezés
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;