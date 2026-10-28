// Szakdolgozat - Készítette: Daruka Illés Zsombor (Neptun: YB3IUF)
// E-mail küldő segédmodul a foglalási értesítések kézbesítéséhez

const nodemailer = require('nodemailer');

const sendBookingStatusEmail = async ({ toEmail, guestName, serviceName, staffName, date, startTime, status }) => {
    // Hiányzó SMTP konfiguráció vagy címzett esetén az e-mail küldés kihagyása
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !toEmail) {
        console.log('E-mail küldés kihagyva: hiányzó SMTP beállítás vagy címzett.');
        return;
    }

    try {
        // SMTP kapcsolat konfigurálása
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const isConfirmed = status === 'confirmed';
        const subject = isConfirmed
            ? 'Időpontfoglalás visszaigazolva!'
            : 'Időpontfoglalás státusza: Elutasítva / Lemondva';

        const statusColor = isConfirmed ? '#16a34a' : '#dc2626';
        const statusText = isConfirmed
            ? 'Örömmel értesítünk, hogy a foglalásodat jóváhagytuk! Várunk szeretettel.'
            : 'Sajnálattal értesítünk, hogy a megjelölt időpontot nem tudjuk biztosítani. Kérjük, válassz másik időpontot a felületen!';

        // HTML formátumú értesítő e-mail sablon összeállítása
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2563eb; margin-top: 0;">Kedves ${guestName}!</h2>
                <p style="font-size: 16px; color: ${statusColor}; font-weight: bold;">${statusText}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <h3 style="margin-bottom: 10px;">A foglalás részletei:</h3>
                <ul style="line-height: 1.8; color: #334155;">
                    <li><strong>Szolgáltatás:</strong> ${serviceName || '-'}</li>
                    <li><strong>Munkatárs:</strong> ${staffName || 'Automatikus beosztás'}</li>
                    <li><strong>Dátum:</strong> ${date}</li>
                    <li><strong>Időpont:</strong> ${startTime}</li>
                </ul>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
                    Ez egy automatikus üzenet az Időpontfoglaló Rendszerből.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Időpontfoglaló Rendszer" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject,
            html: htmlContent
        });
    } catch (error) {
        console.error('Hiba az e-mail kiküldésekor:', error);
    }
};

module.exports = sendBookingStatusEmail;