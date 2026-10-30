// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Publikus időpontfoglaló felület: többlépéses foglalási folyamat, interaktív naptár és ügyfélprofil-kezelés

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Typography, Card, CardContent, Box, Button, TextField,
    CircularProgress, Alert, IconButton, Collapse, Divider, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, useTheme
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../api/axiosConfig';

const DAY_HEADERS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

// Újrahasznosítható kártyakomponens a foglalási lépések megjelenítéséhez
const StepCard = ({ step, activeStep, title, summary, isDone, disabled, onEdit, children }) => {
    const isOpen = activeStep === step;
    return (
        <Card
            elevation={isOpen ? 4 : 1}
            sx={{
                borderLeft: '5px solid',
                borderLeftColor: isDone ? '#22c55e' : (isOpen ? '#2563eb' : 'transparent'),
                opacity: disabled ? 0.6 : 1
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip label={step} color={isDone ? 'success' : (isOpen ? 'primary' : 'default')} size="small" sx={{ fontWeight: 'bold' }} />
                        <Typography variant="h6" fontWeight="bold">{title}</Typography>
                    </Box>
                    {isDone && !isOpen && summary && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body1" fontWeight="bold" color="primary">{summary}</Typography>
                            <Button size="small" variant="outlined" onClick={onEdit}>Módosítás</Button>
                        </Box>
                    )}
                </Box>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />
                    {children}
                </Collapse>
            </CardContent>
        </Card>
    );
};

const PublicBooking = ({ toggleColorMode, mode }) => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isDark = useTheme().palette.mode === 'dark';

    const todayObj = new Date();
    const toIsoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = toIsoDate(todayObj);

    const [activeStep, setActiveStep] = useState(1);
    const [staffList, setStaffList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Bejelentkezett felhasználó állapota és foglalási előzményei
    const [currentUser, setCurrentUser] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

    const [selectedService, setSelectedService] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedTime, setSelectedTime] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
    const [formData, setFormData] = useState({ customerName: '', customerEmail: '', customerPhone: '' });

    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        const loadPageData = async () => {
            try {
                const [staffRes, servicesRes] = await Promise.all([
                    axiosInstance.get(`/staff/company/${companyId}`),
                    axiosInstance.get(`/services/company/${companyId}`)
                ]);
                setStaffList(staffRes.data);
                setServicesList(servicesRes.data);

                const token = localStorage.getItem('token');
                if (token) {
                    const userRes = await axiosInstance.get('/auth/me');
                    const user = userRes.data;
                    setCurrentUser(user);
                    const userFields = {
                        name: user.name || user.companyName || '',
                        email: user.email || '',
                        phone: user.phone || ''
                    };
                    setProfileForm(userFields);
                    setFormData({
                        customerName: userFields.name,
                        customerEmail: userFields.email,
                        customerPhone: userFields.phone
                    });

                    try {
                        const historyRes = await axiosInstance.get('/bookings/guest-history');
                        setMyBookings(historyRes.data);
                    } catch (_) {}
                }
            } catch (error) {
                setFeedback({ type: 'error', message: 'Hiba történt az adatok betöltésekor.' });
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [companyId]);

    // Szabad idősávok lekérése a kiválasztott paraméterek alapján
    useEffect(() => {
        if (!selectedStaff || !selectedService || !selectedDate) return;
        setSelectedTime('');

        const isStaffOnHoliday = (selectedStaff.availability?.daysOff || []).some(
            (d) => String(d).split('T')[0] === selectedDate
        );
        if (isStaffOnHoliday) {
            setAvailableSlots([]);
            return;
        }

        setSlotsLoading(true);
        axiosInstance.get('/bookings/available-slots', {
            params: { companyId, staffId: selectedStaff._id, serviceId: selectedService._id, date: selectedDate }
        })
            .then((res) => setAvailableSlots(Array.isArray(res.data) ? res.data : (res.data.availableSlots || [])))
            .catch(() => setAvailableSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [companyId, selectedStaff, selectedService, selectedDate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setMyBookings([]);
        setFormData({ customerName: '', customerEmail: '', customerPhone: '' });
    };

    // Bejelentkezett felhasználó profiladatainak mentése
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosInstance.put('/auth/profile', profileForm);
            const updated = res.data.user || res.data;
            setCurrentUser(updated);
            setFormData({
                customerName: updated.name || profileForm.name,
                customerEmail: updated.email || profileForm.email,
                customerPhone: updated.phone || profileForm.phone
            });
            setProfileModalOpen(false);
            setFeedback({ type: 'success', message: 'Profiladatok sikeresen frissítve!' });
        } catch (error) {
            setFeedback({ type: 'error', message: 'Hiba történt a profil mentésekor.' });
        }
    };

    // Szolgáltatás kiválasztása és a következő foglalási lépés meghatározása
    const handleSelectService = (service) => {
        setSelectedService(service);
        if (service.requiresStaff === false && staffList.length > 0) {
            setSelectedStaff(staffList[0]);
            setActiveStep(3);
        } else {
            setActiveStep(2);
        }
    };

    const formatSelectedDateTime = () => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dateStr = new Date(y, m - 1, d).toLocaleDateString('hu-HU', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });
        if (!selectedTime || !selectedService) return dateStr;

        const [h, min] = selectedTime.split(':').map(Number);
        const end = new Date(2000, 0, 1, h, min + selectedService.duration);
        const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        return `${dateStr}, ${selectedTime}–${endStr}`;
    };

    // Naptári napok tömbjének előállítása az adott hónapra
    const getCalendarDays = () => {
        const y = currentMonth.getFullYear();
        const m = currentMonth.getMonth();
        const offset = (new Date(y, m, 1).getDay() + 6) % 7;
        const totalDays = new Date(y, m + 1, 0).getDate();

        return [
            ...Array(offset).fill(null),
            ...Array.from({ length: totalDays }, (_, i) => {
                const dateStr = toIsoDate(new Date(y, m, i + 1));
                return { day: i + 1, dateStr, isPast: dateStr < todayStr };
            })
        ];
    };

    // Foglalás véglegesítése és elküldése a szervernek
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback({ type: '', message: '' });

        const [h, min] = selectedTime.split(':').map(Number);
        const end = new Date(2000, 0, 1, h, min + selectedService.duration);
        const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

        try {
            const res = await axiosInstance.post('/bookings', {
                companyId,
                staffId: selectedStaff._id,
                serviceId: selectedService._id,
                date: selectedDate,
                startTime: selectedTime,
                endTime: endTimeStr,
                userId: currentUser?._id || null,
                isRegisteredUser: !!currentUser,
                guestData: {
                    name: formData.customerName,
                    email: formData.customerEmail,
                    phone: formData.customerPhone,
                    isRegistered: !!currentUser
                }
            });

            if (currentUser && res.data && res.data.booking) {
                setMyBookings((prev) => [res.data.booking, ...prev]);
            }
            setFeedback({ type: 'success', message: 'Az időpontfoglalás sikeresen rögzítve!' });
            setActiveStep(5);
        } catch (error) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Hiba a foglalás mentésekor.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const isMinMonth = currentMonth.getFullYear() === todayObj.getFullYear() && currentMonth.getMonth() === todayObj.getMonth();
    const activeBg = isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff';
    const isStaffHoliday = (selectedStaff?.availability?.daysOff || []).some((d) => String(d).split('T')[0] === selectedDate);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" color="primary" fontWeight="bold">Időpontfoglalás</Typography>
                    <Typography variant="body2" color="textSecondary">Válaszd ki a szolgáltatást és a számodra megfelelő időpontot.</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {currentUser ? (
                        <>
                            <Chip
                                avatar={<Avatar>{(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}</Avatar>}
                                label={`${currentUser.name || currentUser.email} (Profilom)`}
                                onClick={() => setProfileModalOpen(true)}
                                deleteIcon={<EditIcon />}
                                onDelete={() => setProfileModalOpen(true)}
                                color="primary"
                                variant="outlined"
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<HistoryIcon />}
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                Előzmények ({myBookings.length})
                            </Button>
                            <IconButton color="error" onClick={handleLogout} title="Kijelentkezés">
                                <LogoutIcon />
                            </IconButton>
                        </>
                    ) : (
                        <Button
                            variant="outlined"
                            startIcon={<LoginIcon />}
                            onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                        >
                            Bejelentkezés / Regisztráció
                        </Button>
                    )}

                    {toggleColorMode && (
                        <IconButton onClick={toggleColorMode} color="inherit" sx={{ border: '1px solid', borderColor: 'divider' }}>
                            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    )}
                </Box>
            </Box>

            <Collapse in={showHistory && !!currentUser}>
                <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Korábbi foglalásaim</Typography>
                    {myBookings.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">Még nincs rögzített foglalásod.</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {myBookings.map((b) => (
                                <Box key={b._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2">
                                        <strong>{new Date(b.date).toLocaleDateString('hu-HU')}</strong> ({b.startTime} - {b.endTime}) • {b.serviceId?.name || 'Szolgáltatás'}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={b.status === 'confirmed' ? 'Elfogadva' : b.status === 'cancelled' ? 'Elutasítva' : 'Függőben'}
                                        color={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'error' : 'warning'}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Card>
            </Collapse>

            {feedback.message && <Alert severity={feedback.type} sx={{ mb: 3 }}>{feedback.message}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* 1. SZOLGÁLTATÁS KIVÁLASZTÁSA */}
                <StepCard
                    step={1} activeStep={activeStep} title="Szolgáltatás kiválasztása"
                    isDone={!!selectedService} summary={selectedService && `${selectedService.name} (${selectedService.price} Ft)`}
                    onEdit={() => setActiveStep(1)}
                >
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {servicesList.map((service) => (
                            <Card
                                key={service._id} variant="outlined"
                                onClick={() => handleSelectService(service)}
                                sx={{
                                    p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderColor: selectedService?._id === service._id ? 'primary.main' : 'divider',
                                    bgcolor: selectedService?._id === service._id ? activeBg : 'transparent',
                                    '&:hover': { borderColor: 'primary.main' }
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">{service.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">{service.duration} perc</Typography>
                                </Box>
                                <Chip label={`${service.price} Ft`} color="secondary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                            </Card>
                        ))}
                    </Box>
                </StepCard>

                {/* 2. MUNKATÁRS KIVÁLASZTÁSA */}
                {selectedService?.requiresStaff !== false && (
                    <StepCard
                        step={2} activeStep={activeStep} title="Munkatárs kiválasztása" disabled={!selectedService}
                        isDone={!!selectedStaff} summary={selectedStaff?.name} onEdit={() => setActiveStep(2)}
                    >
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {staffList.map((staff) => (
                                <Card
                                    key={staff._id} variant="outlined"
                                    onClick={() => { setSelectedStaff(staff); setActiveStep(3); }}
                                    sx={{
                                        p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                                        borderColor: selectedStaff?._id === staff._id ? 'primary.main' : 'divider',
                                        bgcolor: selectedStaff?._id === staff._id ? activeBg : 'transparent',
                                        '&:hover': { borderColor: 'primary.main' }
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>{staff.name[0].toUpperCase()}</Avatar>
                                    <Typography variant="subtitle1" fontWeight="bold">{staff.name}</Typography>
                                </Card>
                            ))}
                        </Box>
                    </StepCard>
                )}

                {/* 3. NAPTÁR ÉS IDŐPONT KIVÁLASZTÁSA */}
                <StepCard
                    step={selectedService?.requiresStaff === false ? 2 : 3}
                    activeStep={activeStep === 3 ? (selectedService?.requiresStaff === false ? 2 : 3) : activeStep}
                    title="Időpont kiválasztása" disabled={!selectedStaff || !selectedService}
                    isDone={!!selectedTime} summary={formatSelectedDateTime()} onEdit={() => setActiveStep(3)}
                >
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 4 }}>
                        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <IconButton size="small" disabled={isMinMonth} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                                    <ChevronLeftIcon />
                                </IconButton>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {currentMonth.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
                                </Typography>
                                <IconButton size="small" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
                                {DAY_HEADERS.map((d) => <Typography key={d} variant="caption" fontWeight="bold" color="textSecondary">{d}</Typography>)}
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                {getCalendarDays().map((item, idx) => {
                                    if (!item) return <Box key={`e-${idx}`} />;

                                    // Múltbeli dátumok kizárása a foglalási lehetőségek közül
                                    let isDisabled = item.isPast; 
                                    
                                    if (!isDisabled && selectedStaff && selectedStaff.availability) {
                                        // Munkatársi szabadságok (eseti szabadnapok) ellenőrzése
                                        const staffDaysOff = (selectedStaff.availability.daysOff || []).map(d => String(d).split('T')[0]);
                                        if (staffDaysOff.includes(item.dateStr)) {
                                            isDisabled = true;
                                        }

                                        // Munkatárs heti állandó beosztásának ellenőrzése az adott napra (Vasárnap indexelésének igazítása 7-re)
                                        const dateObj = new Date(item.dateStr);
                                        const jsDay = dateObj.getDay();
                                        const dayOfWeek = jsDay === 0 ? 7 : jsDay; 
                                        
                                        const worksOnThisDay = selectedStaff.availability.workingHours?.some(
                                            (wh) => wh.dayOfWeek === dayOfWeek
                                        );

                                        if (!worksOnThisDay) {
                                            isDisabled = true;
                                        }
                                    }

                                    return (
                                        <Button
                                            key={item.dateStr} 
                                            disabled={isDisabled} 
                                            onClick={() => setSelectedDate(item.dateStr)}
                                            sx={{
                                                minWidth: 0, height: 36, p: 0, borderRadius: '50%',
                                                bgcolor: item.dateStr === selectedDate ? 'primary.main' : 'transparent',
                                                color: item.dateStr === selectedDate ? '#fff' : (isDisabled ? 'text.disabled' : 'text.primary'),
                                                border: item.dateStr === todayStr && item.dateStr !== selectedDate ? '1px solid' : 'none',
                                                opacity: isDisabled ? 0.3 : 1, // Vizuális visszajelzés az inaktív napokról
                                                '&:hover': { bgcolor: item.dateStr === selectedDate ? 'primary.dark' : (isDisabled ? 'transparent' : 'action.hover') }
                                            }}
                                        >
                                            {item.day}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{formatSelectedDateTime()}</Typography>
                            {slotsLoading ? <CircularProgress size={28} /> : availableSlots.length === 0 ? (
                                <Alert severity={isStaffHoliday ? 'warning' : 'info'}>
                                    {isStaffHoliday
                                        ? `A kiválasztott szakember ezen a napon (${selectedDate}) szabadságon van. Kérjük, válassz másik napot!`
                                        : 'Erre a napra nincs szabad időpont.'}
                                </Alert>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 1.5 }}>
                                    {availableSlots.map((slot) => (
                                        <Button
                                            key={slot} onClick={() => setSelectedTime(slot)}
                                            variant={selectedTime === slot ? 'contained' : 'outlined'}
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </Box>
                            )}
                            {selectedTime && (
                                <Box sx={{ mt: 3, textAlign: 'right' }}>
                                    <Button variant="contained" onClick={() => setActiveStep(4)}>Tovább az adatokhoz</Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </StepCard>

                {/* 4. SZEMÉLYES ADATOK MEGADÁSA */}
                <StepCard
                    step={selectedService?.requiresStaff === false ? 3 : 4}
                    activeStep={activeStep === 4 ? (selectedService?.requiresStaff === false ? 3 : 4) : activeStep}
                    title="Véglegesítés és személyes adatok"
                    disabled={!selectedTime} isDone={activeStep === 5}
                >
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {currentUser && (
                            <Alert severity="info">
                                Bejelentkezve mint <strong>{currentUser.name || currentUser.email}</strong>. Az adataidat automatikusan kitöltöttük!
                            </Alert>
                        )}
                        <TextField label="Teljes név" required fullWidth value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                        <TextField label="E-mail cím" type="email" required fullWidth value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} />
                        <TextField label="Telefonszám" required fullWidth value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
                        <Button type="submit" variant="contained" size="large" disabled={submitting}>
                            {submitting ? 'Küldés...' : 'Foglalás Elküldése'}
                        </Button>
                    </Box>
                </StepCard>

                {activeStep === 5 && (
                    <Card sx={{ textAlign: 'center', p: 4 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Köszönjük a foglalást!</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {selectedService?.name} • {formatSelectedDateTime()}
                        </Typography>
                        <Button variant="outlined" onClick={() => { setSelectedTime(''); setActiveStep(1); setFeedback({ type: '', message: '' }); }}>
                            Új időpont foglalása
                        </Button>
                    </Card>
                )}
            </Box>

            {/* Dialógusablak a bejelentkezett felhasználó profiladatainak módosításához */}
            <Dialog open={profileModalOpen} onClose={() => setProfileModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Profilom szerkesztése</DialogTitle>
                <Box component="form" onSubmit={handleSaveProfile}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Teljes név"
                            required
                            fullWidth
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                        <TextField
                            label="E-mail cím"
                            type="email"
                            required
                            fullWidth
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                        <TextField
                            label="Telefonszám"
                            required
                            fullWidth
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setProfileModalOpen(false)}>Mégse</Button>
                        <Button type="submit" variant="contained" color="primary">Mentés</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Container>
    );
};

export default PublicBooking;
