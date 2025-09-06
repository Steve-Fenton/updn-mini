import { checkUrlHealth } from '../src/uptime.mjs';

describe('Certificate Tests for HTTPS address', () => {
    test('Gets days remaining', async () => {
        const response = await checkUrlHealth('https://example.com');
        expect(response.status).toBe('up');
        expect(response.redirectCount).toBe(0);
        expect(typeof response.responseTime).toBe('number');
        expect(response.responseTime).toBeGreaterThan(0);
    });

    test('Gets days remaining for HTTP address', async () => {
        const response = await checkUrlHealth('http://example.com');
        expect(response.status).toBe('up');
        expect(response.redirectCount).toBe(0);
        expect(typeof response.responseTime).toBe('number');
        expect(response.responseTime).toBeGreaterThan(0);
    });
});