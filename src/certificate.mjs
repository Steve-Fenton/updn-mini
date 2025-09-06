import tls from 'tls';

/**
 * Gets the number of days remaining until the SSL certificate for a given URL expires.
 * @param {string} targetUrl - The URL to check.
 * @returns {Promise<number>} - Days remaining until certificate expires.
 */
export async function getCertificateDaysRemaining(targetUrl) {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(targetUrl);
            const hostname = urlObj.hostname;
            const port = urlObj.port || 443;

            const socket = tls.connect(
                {
                    host: hostname,
                    port: port,
                    servername: hostname,
                    rejectUnauthorized: false,
                },
                () => {
                    const cert = socket.getPeerCertificate();
                    if (!cert || !cert.valid_to) {
                        socket.end();
                        return reject(new Error('Could not get certificate'));
                    }
                    const expiry = new Date(cert.valid_to);
                    const now = new Date();
                    const diffTime = expiry - now;
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    socket.end();
                    resolve(days);
                }
            );

            socket.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(new Error(`Invalid URL: ${error.message}`));
        }
    });
}