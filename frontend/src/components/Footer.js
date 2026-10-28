// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// Globális lábléc komponens az alkalmazás alsó szekciójának megjelenítéséhez

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
    return (
        <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto', borderTop: '1px solid #e5e7eb' }}>
            <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" align="center">
                    © {new Date().getFullYear()} Időpontfoglaló Rendszer. Készítette: Daruka Illés Zsombor (YB3IUF)
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;