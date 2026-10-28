// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Szolgáltatói cégprofil és biztonsági beállítások kezelése

import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Paper, Alert, CircularProgress } from '@mui/material';
import axiosInstance from '../api/axiosConfig';

const Profile = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Aktuális felhasználói adatok lekérése
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get('/auth/me');
                setName(response.data.name || '');
                setEmail(response.data.email || '');
            } catch (err) {
                console.error('Hiba az adatok lekérésekor:', err);
                setError('Nem sikerült betölteni a profiladatokat.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Cégprofil adatainak mentése
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            const payload = { name, email };
            if (password.trim() !== '') {
                payload.password = password;
            }

            await axiosInstance.put('/auth/profile', payload);
            setMessage('A profil adatai sikeresen frissítve lettek.');
            setPassword('');
        } catch (err) {
            console.error('Hiba a mentéskor:', err);
            setError('Hiba történt a profil frissítése során.');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ mt: 5, p: 4 }}>
                <Typography variant="h5" gutterBottom color="primary">Cégprofil és Beállítások</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Itt módosíthatod a szolgáltatásod megjelenő nevét, a bejelentkezési e-mail címedet és a jelszavadat.
                </Typography>

                {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField 
                        required 
                        label="Cég vagy Szolgáltató neve" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                    />
                    <TextField 
                        required 
                        type="email" 
                        label="E-mail cím" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                    <TextField 
                        type="password" 
                        label="Új jelszó (Hagyd üresen, ha nem módosítod)" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <Button type="submit" variant="contained" color="primary" size="large">
                        Módosítások mentése
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Profile;