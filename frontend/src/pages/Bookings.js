// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Beérkezett foglalások listázása, státuszkezelés és regisztrált ügyfelek foglalási előzményei

import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, List, ListItem,
    CircularProgress, Chip, Button, Collapse, Divider
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HistoryIcon from '@mui/icons-material/History';
import axiosInstance from '../api/axiosConfig';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openHistoryId, setOpenHistoryId] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await axiosInstance.get('/bookings/my-bookings');
                setBookings(response.data);
            } catch (error) {
                console.error('Hiba a foglalások betöltésekor:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    // Foglalás státuszának frissítése
    const updateBookingStatus = async (id, newStatus) => {
        try {
            await axiosInstance.patch(`/bookings/${id}/status`, { status: newStatus });
            setBookings(bookings.map((booking) =>
                booking._id === id ? { ...booking, status: newStatus } : booking
            ));
        } catch (error) {
            console.error('Hiba a státusz frissítésekor:', error);
        }
    };

    // Foglalás végleges törlése az adatbázisból
    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a foglalást a rendszerből?')) return;

        try {
            await axiosInstance.delete(`/bookings/${id}`);
            setBookings(bookings.filter((booking) => booking._id !== id));
        } catch (error) {
            console.error('Hiba a törlés során:', error);
        }
    };

    // Státuszjelvény meghatározása a foglalás aktuális állapota alapján
    const getStatusChip = (status) => {
        switch (status) {
            case 'pending':
                return <Chip label="Jóváhagyásra vár" color="warning" size="small" />;
            case 'confirmed':
                return <Chip label="Elfogadva" color="success" size="small" />;
            case 'cancelled':
                return <Chip label="Elutasítva" color="error" size="small" />;
            default:
                return <Chip label="Ismeretlen" size="small" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Regisztrált ügyfél korábbi foglalásainak kigyűjtése azonosító vagy e-mail cím alapján
    const getCustomerHistory = (currentBooking) => {
        const email = currentBooking.guestData?.email;
        const userId = currentBooking.userId;

        return bookings.filter((b) => {
            if (b._id === currentBooking._id) return false;
            if (userId && b.userId && String(b.userId) === String(userId)) return true;
            if (email && b.guestData?.email && b.guestData.email.toLowerCase() === email.toLowerCase()) return true;
            return false;
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ mt: 5, mb: 5, p: 4 }}>
                <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
                    Beérkezett Foglalások
                </Typography>

                <List>
                    {bookings.length === 0 ? (
                        <Typography color="textSecondary">Jelenleg nincs egyetlen foglalás sem a rendszerben.</Typography>
                    ) : (
                        bookings.map((booking) => {
                            const isRegistered = Boolean(
                                booking.userId || booking.isRegisteredUser || booking.guestData?.isRegistered
                            );
                            const customerHistory = isRegistered ? getCustomerHistory(booking) : [];
                            const isHistoryOpen = openHistoryId === booking._id;

                            return (
                                <ListItem
                                    key={booking._id}
                                    divider
                                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', py: 2 }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {formatDate(booking.date)} | {booking.startTime} - {booking.endTime}
                                                </Typography>

                                                {isRegistered ? (
                                                    <Chip
                                                        icon={<VerifiedUserIcon />}
                                                        label="Bejelentkezett felhasználó"
                                                        color="info"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Vendég (nem regisztrált)"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>

                                            <Typography variant="body2" color="text.primary">
                                                <strong>Vendég:</strong> {booking.guestData?.name || 'Névtelen'} ({booking.guestData?.phone || 'Nincs telefon'}, {booking.guestData?.email || 'Nincs e-mail'})
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Szolgáltatás:</strong> {booking.serviceId?.name}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Munkatárs:</strong> {booking.staffId?.name}
                                            </Typography>

                                            {/* Az előzmények gomb megjelenítése regisztrált felhasználók esetén */}
                                            {isRegistered && (
                                                <Button
                                                    size="small"
                                                    startIcon={<HistoryIcon />}
                                                    sx={{ mt: 1 }}
                                                    onClick={() => setOpenHistoryId(isHistoryOpen ? null : booking._id)}
                                                >
                                                    Előzmények ({customerHistory.length} korábbi foglalás)
                                                </Button>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                            {getStatusChip(booking.status)}

                                            {booking.status === 'pending' && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                                    >
                                                        Elfogad
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                                    >
                                                        Elutasít
                                                    </Button>
                                                </Box>
                                            )}

                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteBooking(booking._id)}
                                            >
                                                Törlés
                                            </Button>
                                        </Box>
                                    </Box>

                                    {/* Lenyíló előzmény-panel regisztrált felhasználókhoz */}
                                    {isRegistered && (
                                        <Collapse in={isHistoryOpen} timeout="auto" unmountOnExit>
                                            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                    Ügyfél korábbi foglalásai a rendszerben:
                                                </Typography>
                                                <Divider sx={{ mb: 1 }} />
                                                {customerHistory.length === 0 ? (
                                                    <Typography variant="body2" color="textSecondary">
                                                        Ennek a regisztrált felhasználónak ez az első foglalása.
                                                    </Typography>
                                                ) : (
                                                    customerHistory.map((hist) => (
                                                        <Box
                                                            key={hist._id}
                                                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}
                                                        >
                                                            <Typography variant="body2">
                                                                {formatDate(hist.date)} ({hist.startTime} - {hist.endTime}) — {hist.serviceId?.name} ({hist.staffId?.name})
                                                            </Typography>
                                                            {getStatusChip(hist.status)}
                                                        </Box>
                                                    ))
                                                )}
                                            </Box>
                                        </Collapse>
                                    )}
                                </ListItem>
                            );
                        })
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default Bookings;