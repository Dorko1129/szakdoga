// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Szolgáltatói vezérlőpult kezdőlapja: napi, függőben lévő és havi statisztikák, valamint gyorsnézeti listák

import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Card, CardContent, Box, CircularProgress,
    Button, TextField, Snackbar, Alert, useTheme, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const Home = () => {
    const [stats, setStats] = useState({ today: 0, pending: 0, monthly: 0 });
    const [companyId, setCompanyId] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userRes = await axiosInstance.get('/auth/me');
                const cId = userRes.data._id;
                setCompanyId(cId);

                const [bookingsRes, staffRes, servicesRes] = await Promise.all([
                    axiosInstance.get('/bookings/my-bookings'),
                    axiosInstance.get(`/staff/company/${cId}`),
                    axiosInstance.get(`/services/company/${cId}`)
                ]);

                const bookings = bookingsRes.data;
                setStaffList(staffRes.data);
                setServicesList(servicesRes.data);

                // Mai dátum és aktuális hónap előtag előállítása a statisztikai szűréshez
                const dateObj = new Date();
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');

                const todayStr = `${year}-${month}-${day}`;
                const currentMonthPrefix = `${year}-${month}`;

                const pendingCount = bookings.filter((b) => b.status === 'pending').length;
                const todayCount = bookings.filter((b) => b.date?.startsWith(todayStr) && b.status !== 'cancelled').length;
                const monthlyCount = bookings.filter((b) => b.date?.startsWith(currentMonthPrefix) && b.status !== 'cancelled').length;

                setStats({ today: todayCount, pending: pendingCount, monthly: monthlyCount });
            } catch (error) {
                console.error('Hiba az adatok betöltésekor:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Publikus foglalási hivatkozás másolása a vágólapra
    const handleCopyLink = () => {
        const link = `${window.location.origin}/foglalas/${companyId}`;
        navigator.clipboard.writeText(link);
        setSnackbarOpen(true);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const publicLink = `${window.location.origin}/foglalas/${companyId}`;

    const cardColors = {
        today: {
            bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#e3f2fd',
            text: isDark ? '#93c5fd' : 'textSecondary',
            num: isDark ? '#60a5fa' : 'primary.main'
        },
        pending: {
            bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#fff3e0',
            text: isDark ? '#fdba74' : 'textSecondary',
            num: isDark ? '#fb923c' : 'warning.main'
        },
        monthly: {
            bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#e8f5e9',
            text: isDark ? '#86efac' : 'textSecondary',
            num: isDark ? '#4ade80' : 'success.main'
        }
    };

    // Közös stílusdefiníció a statisztikai kártyákhoz
    const statCardStyle = (bgColor) => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 2,
        bgcolor: bgColor,
        cursor: 'pointer',
        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
        }
    });

    return (
        <Container maxWidth={false} sx={{ mt: 5, mb: 5, px: { xs: 2, md: 4, lg: 6 } }}>
            <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
                Áttekintés
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
                Üdvözlünk a vezérlőpulton! Itt láthatod a rendszer legfontosabb aktuális adatait.
            </Typography>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 4,
                width: '100%'
            }}>
                {/* BAL OLDAL: Publikus link megosztása és statisztikai kártyák */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <Card elevation={3} sx={{ width: '100%', p: 3, borderLeft: '5px solid #2563eb' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom fontWeight="bold">A Te publikus foglalási linked</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                Ezt a linket oszd meg a vendégeiddel, hogy időpontot tudjanak foglalni hozzád.
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                                <TextField fullWidth variant="outlined" value={publicLink} InputProps={{ readOnly: true }} />
                                <Button
                                    variant="contained" color="primary" size="large" onClick={handleCopyLink}
                                    sx={{ minWidth: '160px', height: '56px', width: { xs: '100%', sm: 'auto' } }}
                                >
                                    Link Másolása
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                        gap: 3,
                        flexGrow: 1,
                        width: '100%'
                    }}>
                        <Card elevation={3} onClick={() => navigate('/bookings')} sx={statCardStyle(cardColors.today.bg)}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" display="block" sx={{ color: cardColors.today.text, mb: 1, fontWeight: 'bold' }}>
                                    MAI FOGLALÁSOK
                                </Typography>
                                <Typography variant="h3" sx={{ color: cardColors.today.num, fontWeight: 'bold' }}>
                                    {stats.today}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card elevation={3} onClick={() => navigate('/bookings')} sx={statCardStyle(cardColors.pending.bg)}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" display="block" sx={{ color: cardColors.pending.text, mb: 1, fontWeight: 'bold' }}>
                                    JÓVÁHAGYÁSRA VÁR
                                </Typography>
                                <Typography variant="h3" sx={{ color: cardColors.pending.num, fontWeight: 'bold' }}>
                                    {stats.pending}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card elevation={3} onClick={() => navigate('/bookings')} sx={statCardStyle(cardColors.monthly.bg)}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" display="block" sx={{ color: cardColors.monthly.text, mb: 1, fontWeight: 'bold' }}>
                                    HAVI FOGLALÁSOK
                                </Typography>
                                <Typography variant="h3" sx={{ color: cardColors.monthly.num, fontWeight: 'bold' }}>
                                    {stats.monthly}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* JOBB OLDAL: Munkatársak és szolgáltatások gyorslistája */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <Card elevation={3} sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '220px', maxHeight: '250px' }}>
                        <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">Munkatársak</Typography>
                        </Box>
                        <CardContent sx={{ flex: 1, overflowY: 'auto', p: 0, '&:last-child': { pb: 0 } }}>
                            <List disablePadding>
                                {staffList.length === 0 ? (
                                    <Typography sx={{ p: 2 }} color="textSecondary" variant="body2">Nincs még rögzítve munkatárs.</Typography>
                                ) : (
                                    staffList.map((staff, index) => (
                                        <React.Fragment key={staff._id}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={<Typography variant="body1" fontWeight="bold">{staff.name}</Typography>}
                                                    secondary={`${staff.availability?.workingHours?.length || 0} munkanap/hét`}
                                                />
                                            </ListItem>
                                            {index < staffList.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))
                                )}
                            </List>
                        </CardContent>
                    </Card>

                    <Card elevation={3} sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '220px', maxHeight: '250px' }}>
                        <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="secondary">Szolgáltatások</Typography>
                        </Box>
                        <CardContent sx={{ flex: 1, overflowY: 'auto', p: 0, '&:last-child': { pb: 0 } }}>
                            <List disablePadding>
                                {servicesList.length === 0 ? (
                                    <Typography sx={{ p: 2 }} color="textSecondary" variant="body2">Nincs még rögzítve szolgáltatás.</Typography>
                                ) : (
                                    servicesList.map((service, index) => (
                                        <React.Fragment key={service._id}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={<Typography variant="body1" fontWeight="bold">{service.name}</Typography>}
                                                    secondary={`${service.duration} perc • ${service.price} Ft`}
                                                />
                                            </ListItem>
                                            {index < servicesList.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <Snackbar
                open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    Foglalási link sikeresen a vágólapra másolva!
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Home;