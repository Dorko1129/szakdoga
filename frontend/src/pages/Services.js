// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Szolgáltatások kezelése: létrehozás, módosítás, törlés és munkatárs-igény konfigurálása

import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, TextField, Button, Box, List,
    ListItem, FormControlLabel, Switch, Chip
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';

const Services = () => {
    const [services, setServices] = useState([]);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState('');
    const [requiresStaff, setRequiresStaff] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [companyId, setCompanyId] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const userRes = await axiosInstance.get('/auth/me');
                const cId = userRes.data._id;
                setCompanyId(cId);

                const res = await axiosInstance.get(`/services/company/${cId}`);
                setServices(res.data);
            } catch (error) {
                console.error('Hiba a szolgáltatások betöltésekor:', error);
            }
        };

        fetchServices();
    }, []);

    // Szolgáltatás mentése vagy frissítése az adatbázisban
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                companyId,
                name,
                duration: Number(duration),
                price: Number(price),
                requiresStaff
            };

            if (editingId) {
                const res = await axiosInstance.put(`/services/${editingId}`, payload);
                const updated = res.data.service || res.data;
                setServices(services.map((s) => (s._id === editingId ? updated : s)));
                setEditingId(null);
            } else {
                const res = await axiosInstance.post('/services', payload);
                const created = res.data.service || res.data;
                setServices([...services, created]);
            }

            setName('');
            setDuration('');
            setPrice('');
            setRequiresStaff(true);
        } catch (error) {
            console.error('Hiba a szolgáltatás mentésekor:', error);
        }
    };

    const handleEdit = (service) => {
        setEditingId(service._id);
        setName(service.name);
        setDuration(service.duration);
        setPrice(service.price);
        setRequiresStaff(service.requiresStaff !== false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a szolgáltatást?')) return;
        try {
            await axiosInstance.delete(`/services/${id}`);
            setServices(services.filter((s) => s._id !== id));
        } catch (error) {
            console.error('Hiba a törlés során:', error);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                    {editingId ? 'Szolgáltatás Módosítása' : 'Új Szolgáltatás Felvétele'}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                    <TextField
                        label="Szolgáltatás megnevezése"
                        required
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                            label="Időtartam (perc)"
                            type="number"
                            required
                            fullWidth
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />
                        <TextField
                            label="Ár (Ft)"
                            type="number"
                            required
                            fullWidth
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </Box>

                    {/* Beállítás a munkatárs-választás kötelezőségéhez */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={requiresStaff}
                                onChange={(e) => setRequiresStaff(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="A foglaláshoz a vendégnek munkatársat is ki kell választania"
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" color="primary" size="large">
                            {editingId ? 'Módosítás Mentése' : 'Hozzáadás'}
                        </Button>
                        {editingId && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setName('');
                                    setDuration('');
                                    setPrice('');
                                    setRequiresStaff(true);
                                }}
                            >
                                Mégse
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" color="secondary" fontWeight="bold" gutterBottom>
                    Szolgáltatások Listája
                </Typography>

                <List>
                    {services.length === 0 ? (
                        <Typography color="textSecondary">Még nincs rögzítve szolgáltatás.</Typography>
                    ) : (
                        services.map((service) => (
                            <ListItem
                                key={service._id}
                                divider
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {service.name}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={service.requiresStaff === false ? 'default' : 'primary'}
                                            label={service.requiresStaff === false ? 'Munkatárs nem szükséges' : 'Munkatárs-választós'}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Időtartam: {service.duration} perc • Ár: {service.price} Ft
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" size="small" onClick={() => handleEdit(service)}>
                                        Szerkesztés
                                    </Button>
                                    <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(service._id)}>
                                        Törlés
                                    </Button>
                                </Box>
                            </ListItem>
                        ))
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default Services;