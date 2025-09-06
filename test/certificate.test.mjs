import { getCertificateDaysRemaining } from '../src/certificate.mjs';

describe('Certificate Tests', () => {
    test('Gets days remaining', async () => {
        const days = await getCertificateDaysRemaining('https://example.com');
        expect(typeof days).toBe('number');
        expect(days).toBeGreaterThan(1);
    });
});