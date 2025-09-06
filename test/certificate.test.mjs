import { getCertificateDaysRemaining } from '../src/certificate.mjs';

describe('Certificate Tests', () => {
    test('Gets days remaining', async () => {
        const cert = await getCertificateDaysRemaining('https://example.com');
        expect(typeof cert.days).toBe('number');
        expect(cert.days).toBeGreaterThan(1);
    });
});