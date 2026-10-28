// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Bejelentkezési és regisztrációs felület szerepkör-alapú átirányítással

import React, { useState } from 'react';
import {
    Container, Paper, Typography, TextField, Button, Box,
    Alert, Tabs, Tab, ToggleButton, ToggleButtonGroup, IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import axiosInstance from '../api/axiosConfig';

const Login = ({ toggleColorMode, mode }) => {
    // Aktív fül indexe: 0 = Bejelentkezés, 1 = Regisztráció
    const [tabIndex, setTabIndex] = useState(0);
    // Választott regisztrációs szerepkör
    const [role, setRole] = useState('guest');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Visszairányítási útvonal kiolvasása az URL paraméterekből
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (tabIndex === 0) {
                // Bejelentkezési folyamat
                const response = await axiosInstance.post('/auth/login', {
                    email: formData.email,
                    password: formData.password
                });

                localStorage.setItem('token', response.data.token);
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Szerepkör-alapú átirányítás sikeres hitelesítés után
                const loggedInRole = response.data.user.role;
                if (loggedInRole === 'company' || loggedInRole === 'admin') {
                    navigate(redirectPath || '/');
                } else {
                    navigate(redirectPath || '/vendeg-profil');
                }
            } else {
                // Regisztrációs folyamat a kiválasztott szerepkörrel
                const response = await axiosInstance.post('/auth/register', {
                    name: formData.name,
                    companyName: role === 'company' ? formData.name : undefined,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: role
                });

                // Automatikus beléptetés és átirányítás a kapott JWT tokennel
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    if (response.data.user) {
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                    }
                    
                    const loggedInRole = response.data.user.role;
                    if (loggedInRole === 'company' || loggedInRole === 'admin') {
                        navigate(redirectPath || '/');
                    } else {
                        navigate(redirectPath || '/vendeg-profil');
                    }
                } else {
                    setSuccessMsg('Sikeres regisztráció! Most már bejelentkezhetsz.');
                    setTabIndex(0);
                }
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Hiba történt a művelet során. Ellenőrizd a megadott adatokat!'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                {toggleColorMode && (
                    <IconButton onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                )}
            </Box>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Tabs
                    value={tabIndex}
                    onChange={(_, newValue) => {
                        setTabIndex(newValue);
                        setError('');
                        setSuccessMsg('');
                    }}
                    variant="fullWidth"
                    sx={{ mb: 3 }}
                >
                    <Tab label="Bejelentkezés" />
                    <Tab label="Regisztráció" />
                </Tabs>

                <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
                    {tabIndex === 0 ? 'Üdvözlünk újra!' : 'Fiók létrehozása'}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tabIndex === 1 && (
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, textAlign: 'center' }}>
                                Milyen fiókot szeretnél létrehozni?
                            </Typography>
                            <ToggleButtonGroup
                                color="primary"
                                value={role}
                                exclusive
                                fullWidth
                                onChange={(_, newRole) => { if (newRole) setRole(newRole); }}
                                size="small"
                            >
                                <ToggleButton value="guest" sx={{ py: 1, gap: 1 }}>
                                    <PersonIcon fontSize="small" />
                                    Vendég
                                </ToggleButton>
                                <ToggleButton value="company" sx={{ py: 1, gap: 1 }}>
                                    <StorefrontIcon fontSize="small" />
                                    Szolgáltató (Cég)
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    )}

                    {tabIndex === 1 && (
                        <>
                            <TextField
                                label={role === 'company' ? 'Cég / Szalon neve' : 'Teljes név'}
                                name="name"
                                required
                                fullWidth
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Telefonszám"
                                name="phone"
                                required
                                fullWidth
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </>
                    )}

                    <TextField
                        label="E-mail cím"
                        name="email"
                        type="email"
                        required
                        fullWidth
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <TextField
                        label="Jelszó"
                        name="password"
                        type="password"
                        required
                        fullWidth
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 1, py: 1.4 }}
                    >
                        {loading
                            ? 'Folyamatban...'
                            : (tabIndex === 0 ? 'Belépés' : 'Regisztráció')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;