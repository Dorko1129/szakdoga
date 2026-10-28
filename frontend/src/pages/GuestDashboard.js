// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Ügyfél vezérlőpult: személyes profiladatok szerkesztése és foglalási előzmények megtekintése

import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, TextField, Button,
    Alert, CircularProgress, List, ListItem, Divider, Chip, IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const GuestDashboard = ({ toggleColorMode, mode }) => {
    const navigate = useNavigate();
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchGuestData = async () => {
            try {
                // 1. Felhasználói profiladatok lekérése
                const userRes = await axiosInstance.get('/auth/me');
                setUserForm({
                    name: userRes.data.name || '',
                    email: userRes.data.email || '',
                    phone: userRes.data.phone || '',
                    password: ''
                });

                // 2. Korábbi foglalások lekérése
                const historyRes = await axiosInstance.get('/bookings/guest-history');
                setHistory(historyRes.data);
            } catch (error) {
                console.error('Hiba az adatok betöltésekor', error);
                setFeedback({ type: 'error', message: 'Hiba történt az adatok lekérésekor.' });
            } finally {
                setLoading(false);
            }
        };

        fetchGuestData();
    }, []);

    // Személyes adatok frissítése
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback({ type: '', message: '' });

        try {
            await axiosInstance.put('/auth/profile', userForm);
            setFeedback({ type: 'success', message: 'Profiladatok sikeresen frissítve!' });
            setUserForm(prev => ({ ...prev, password: '' }));
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Hiba történt a profil frissítésekor.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending': return <Chip label="Függőben" color="warning" size="small" />;
            case 'confirmed': return <Chip label="Elfogadva" color="success" size="small" />;
            case 'cancelled': return <Chip label="Elutasítva" color="error" size="small" />;
            default: return <Chip label="Ismeretlen" size="small" />;
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            {/* Fejléc témaváltóval és kijelentkezés gombbal */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                    Üdvözlünk, {userForm.name.split(' ')[0]}!
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {toggleColorMode && (
                        <IconButton onClick={toggleColorMode} color="inherit" sx={{ border: '1px solid', borderColor: 'divider' }}>
                            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    )}
                    <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                        Kijelentkezés
                    </Button>
                </Box>
            </Box>

            {feedback.message && (
                <Alert severity={feedback.type} sx={{ mb: 3 }}>{feedback.message}</Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' }, gap: 4 }}>
                
                {/* BAL OLDAL: Profil szerkesztése */}
                <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Személyes Adatok</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Teljes név" required fullWidth
                            value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        />
                        <TextField
                            label="E-mail cím" type="email" required fullWidth
                            value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                        <TextField
                            label="Telefonszám" fullWidth
                            value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        />
                        <TextField
                            label="Új jelszó (opcionális)" type="password" fullWidth
                            placeholder="Hagyd üresen, ha nem változtatod meg"
                            value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        />
                        <Button type="submit" variant="contained" color="primary" disabled={submitting} sx={{ mt: 1 }}>
                            {submitting ? 'Mentés...' : 'Adatok Frissítése'}
                        </Button>
                    </Box>
                </Paper>

                {/* JOBB OLDAL: Foglalási előzmények */}
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Eddigi Foglalásaim</Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List disablePadding>
                        {history.length === 0 ? (
                            <Typography color="textSecondary" sx={{ py: 2 }}>
                                Még nem foglaltál időpontot egyetlen szolgáltatónál sem.
                            </Typography>
                        ) : (
                            history.map((booking) => (
                                <ListItem key={booking._id} divider sx={{ px: 0, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                            {booking.companyId?.name || booking.companyId?.companyName || 'Ismeretlen szolgáltató'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            <strong>Dátum:</strong> {new Date(booking.date).toLocaleDateString('hu-HU')} ({booking.startTime} - {booking.endTime})
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Szolgáltatás:</strong> {booking.serviceId?.name} ({booking.serviceId?.price} Ft)
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Munkatárs:</strong> {booking.staffId?.name || '-'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ ml: 2, mt: 0.5 }}>
                                        {getStatusChip(booking.status)}
                                    </Box>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
};

export default GuestDashboard;