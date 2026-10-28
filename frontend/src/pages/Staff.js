// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Munkatársak kezelése: felvétel, módosítás, heti munkarend és szabadnapok beállítása

import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, TextField, Button, Box, List, ListItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, FormControlLabel, Chip, Divider, Alert
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axiosInstance from '../api/axiosConfig';

const DAYS_OF_WEEK = [
    { dayOfWeek: 1, label: 'Hétfő' },
    { dayOfWeek: 2, label: 'Kedd' },
    { dayOfWeek: 3, label: 'Szerda' },
    { dayOfWeek: 4, label: 'Csütörtök' },
    { dayOfWeek: 5, label: 'Péntek' },
    { dayOfWeek: 6, label: 'Szombat' },
    { dayOfWeek: 0, label: 'Vasárnap' }
];

const DEFAULT_WORKING_HOURS = [1, 2, 3, 4, 5].map((d) => ({
    dayOfWeek: d,
    startTime: '09:00',
    endTime: '17:00'
}));

// Segédfüggvény az ISO dátumok ÉÉÉÉ-HH-NN formátumra alakításához
const cleanDateStr = (dateVal) => {
    if (!dateVal) return '';
    return String(dateVal).split('T')[0];
};

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [name, setName] = useState('');
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [companyId, setCompanyId] = useState('');

    // Munkarend és szabadság szerkesztőablak állapotai
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [workingHours, setWorkingHours] = useState([]);
    const [daysOff, setDaysOff] = useState([]);
    const [newDayOff, setNewDayOff] = useState('');
    const [feedback, setFeedback] = useState('');

    const fetchStaffData = async () => {
        try {
            const userRes = await axiosInstance.get('/auth/me');
            const cId = userRes.data._id;
            setCompanyId(cId);

            const staffRes = await axiosInstance.get(`/staff/company/${cId}`);
            setStaffList(staffRes.data);
        } catch (error) {
            console.error('Hiba a munkatársak betöltésekor:', error);
        }
    };

    useEffect(() => {
        fetchStaffData();
    }, []);

    // Új munkatárs létrehozása vagy meglévő nevének módosítása
    const handleSaveStaff = async (e) => {
        e.preventDefault();
        setFeedback('');

        try {
            if (editingStaffId) {
                const current = staffList.find((s) => s._id === editingStaffId);
                const res = await axiosInstance.put(`/staff/${editingStaffId}`, {
                    name,
                    availability: current?.availability || { workingHours: DEFAULT_WORKING_HOURS, daysOff: [] }
                });
                const updatedStaff = res.data.staff || res.data;
                setStaffList(staffList.map((s) => (s._id === editingStaffId ? updatedStaff : s)));
                setEditingStaffId(null);
            } else {
                const res = await axiosInstance.post('/staff', {
                    companyId,
                    name,
                    availability: { workingHours: DEFAULT_WORKING_HOURS, daysOff: [] }
                });
                const createdStaff = res.data.staff || res.data;
                setStaffList([...staffList, createdStaff]);
            }
            setName('');
        } catch (error) {
            console.error('Hiba a munkatárs mentésekor:', error);
        }
    };

    const handleEditClick = (staff) => {
        setEditingStaffId(staff._id);
        setName(staff.name);
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a munkatársat?')) return;
        try {
            await axiosInstance.delete(`/staff/${id}`);
            setStaffList(staffList.filter((s) => s._id !== id));
        } catch (error) {
            console.error('Hiba a munkatárs törlésekor:', error);
        }
    };

    // Beosztás és szabadságok szerkesztőablakának megnyitása
    const handleOpenSchedule = (staff) => {
        setSelectedStaff(staff);
        setWorkingHours(staff.availability?.workingHours || DEFAULT_WORKING_HOURS);
        const normalizedDaysOff = (staff.availability?.daysOff || []).map(cleanDateStr);
        setDaysOff(normalizedDaysOff);
        setNewDayOff('');
        setScheduleModalOpen(true);
    };

    // Munkanap aktiválása vagy kikapcsolása a heti beosztásban
    const handleToggleDay = (dayOfWeek) => {
        const exists = workingHours.some((wh) => wh.dayOfWeek === dayOfWeek);
        if (exists) {
            setWorkingHours(workingHours.filter((wh) => wh.dayOfWeek !== dayOfWeek));
        } else {
            setWorkingHours([...workingHours, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]);
        }
    };

    // Adott nap kezdési vagy befejezési idejének frissítése
    const handleTimeChange = (dayOfWeek, field, value) => {
        setWorkingHours(workingHours.map((wh) =>
            wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
        ));
    };

    // Hétfői munkaidő másolása az összes hétköznapra
    const handleCopyMondayToWeekdays = () => {
        const monday = workingHours.find((wh) => wh.dayOfWeek === 1);
        if (!monday) return;

        const weekend = workingHours.filter((wh) => wh.dayOfWeek === 0 || wh.dayOfWeek === 6);
        const weekdays = [1, 2, 3, 4, 5].map((d) => ({
            dayOfWeek: d,
            startTime: monday.startTime,
            endTime: monday.endTime
        }));
        setWorkingHours([...weekdays, ...weekend]);
    };

    // Új szabadnap hozzáadása a listához
    const handleAddDayOff = () => {
        if (!newDayOff || daysOff.includes(newDayOff)) return;
        const updated = [...daysOff, newDayOff].sort();
        setDaysOff(updated);
        setNewDayOff('');
    };

    // Szabadnap eltávolítása a listából
    const handleRemoveDayOff = (dateToRemove) => {
        setDaysOff(daysOff.filter((d) => d !== dateToRemove));
    };

    // Beosztás és szabadságok mentése az adatbázisba
    const handleSaveSchedule = async () => {
        if (!selectedStaff) return;
        try {
            const updatedAvailability = {
                ...selectedStaff.availability,
                workingHours,
                daysOff
            };

            const res = await axiosInstance.put(`/staff/${selectedStaff._id}`, {
                name: selectedStaff.name,
                availability: updatedAvailability
            });

            // A frissített munkatárs adatainak visszaírása a helyi állapotba
            const updatedStaff = res.data?.staff || (res.data?._id ? res.data : {
                ...selectedStaff,
                availability: updatedAvailability
            });

            setStaffList(staffList.map((s) => (s._id === selectedStaff._id ? updatedStaff : s)));
            setScheduleModalOpen(false);
            setFeedback(`${selectedStaff.name} beosztása és szabadságai sikeresen frissítve!`);
        } catch (error) {
            console.error('Hiba a beosztás mentésekor:', error);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            {feedback && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setFeedback('')}>
                    {feedback}
                </Alert>
            )}

            {/* Felső kártya: Munkatárs hozzáadása és módosítása */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                    {editingStaffId ? 'Munkatárs Módosítása' : 'Új Munkatárs Felvétele'}
                </Typography>

                <Box component="form" onSubmit={handleSaveStaff} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                    <TextField
                        label="Munkatárs neve"
                        required
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" color="primary" size="large">
                            {editingStaffId ? 'Módosítás' : 'Hozzáadás'}
                        </Button>
                        {editingStaffId && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="large"
                                onClick={() => {
                                    setEditingStaffId(null);
                                    setName('');
                                }}
                            >
                                Mégse
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Alsó kártya: Munkatársak listája */}
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" color="secondary" fontWeight="bold" gutterBottom>
                    Munkatársak Listája
                </Typography>

                <List>
                    {staffList.length === 0 ? (
                        <Typography color="textSecondary">Még nincs rögzítve munkatárs.</Typography>
                    ) : (
                        staffList.map((staff) => {
                            const staffDaysOff = (staff.availability?.daysOff || []).map(cleanDateStr);
                            return (
                                <ListItem
                                    key={staff._id}
                                    divider
                                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, py: 2 }}
                                >
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {staff.name}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary">
                                            Aktív munkanapok: {staff.availability?.workingHours?.length || 0} nap/hét
                                        </Typography>

                                        {/* Rögzített szabadnapok megjelenítése */}
                                        {staffDaysOff.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                                <Typography variant="caption" color="warning.main" fontWeight="bold">
                                                    Szabadságon:
                                                </Typography>
                                                {staffDaysOff.map((dateStr) => (
                                                    <Chip
                                                        key={dateStr}
                                                        icon={<EventBusyIcon />}
                                                        label={dateStr}
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained"
                                            color="info"
                                            size="small"
                                            onClick={() => handleOpenSchedule(staff)}
                                        >
                                            Beosztás & Szabadság
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            onClick={() => handleEditClick(staff)}
                                        >
                                            Szerkesztés
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => handleDeleteStaff(staff._id)}
                                        >
                                            Törlés
                                        </Button>
                                    </Box>
                                </ListItem>
                            );
                        })
                    )}
                </List>
            </Paper>

            {/* Dialógusablak a heti munkarend és szabadságok beállításához */}
            <Dialog open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {selectedStaff?.name} — Munkarend és Szabadságok
                </DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            1. Állandó heti beosztás
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyMondayToWeekdays}
                        >
                            Hétfő másolása hétköznapokra
                        </Button>
                    </Box>

                    {DAYS_OF_WEEK.map((day) => {
                        const dayConfig = workingHours.find((wh) => wh.dayOfWeek === day.dayOfWeek);
                        const isWorking = Boolean(dayConfig);

                        return (
                            <Box
                                key={day.dayOfWeek}
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isWorking}
                                            onChange={() => handleToggleDay(day.dayOfWeek)}
                                        />
                                    }
                                    label={day.label}
                                    sx={{ minWidth: '130px' }}
                                />

                                {isWorking ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={dayConfig.startTime}
                                            onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                                        />
                                        <Typography>-</Typography>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={dayConfig.endTime}
                                            onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                                        />
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Pihenőnap
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}

                    <Divider sx={{ my: 3 }} />

                    {/* Egyedi szabadnapok rögzítése */}
                    <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                        2. Szabadság / Eseti szabadnapok kivétele
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        A kiválasztott naptári napokon a munkatárshoz nem lehet majd időpontot foglalni.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={newDayOff}
                            onChange={(e) => setNewDayOff(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button variant="contained" color="secondary" onClick={handleAddDayOff} sx={{ minWidth: '140px' }}>
                            Szabadnap hozzáadása
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {daysOff.length === 0 ? (
                            <Typography variant="body2" color="textSecondary">
                                Nincs rögzített szabadnap.
                            </Typography>
                        ) : (
                            daysOff.map((dateStr) => (
                                <Chip
                                    key={dateStr}
                                    label={dateStr}
                                    color="warning"
                                    onDelete={() => handleRemoveDayOff(dateStr)}
                                />
                            ))
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setScheduleModalOpen(false)}>Mégse</Button>
                    <Button variant="contained" color="primary" onClick={handleSaveSchedule}>
                        Beállítások Mentése
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Staff;