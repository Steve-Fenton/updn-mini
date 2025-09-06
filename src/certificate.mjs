import tls from 'tls';

/**
 * Gets the number of days remaining until the SSL certificate for a given URL expires.
 * @param {string} targetUrl - The URL to check.
 * @returns {Promise<{days: number, cert: object}>} - Days remaining and certificate info.
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
                    servername: hostname, // Important for SNI
                    rejectUnauthorized: false,
                    // Add timeout to prevent hanging
                    timeout: 10000,
                },
                () => {
                    try {
                        // Get the actual peer certificate (not cached)
                        const cert = socket.getPeerCertificate(false); // false = don't get full chain
                        
                        if (!cert || !cert.valid_to) {
                            socket.end();
                            return reject(new Error('Could not get certificate or no valid_to field'));
                        }

                        const expiry = new Date(cert.valid_to);
                        const now = new Date();
                        const diffTime = expiry - now;
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        socket.end();
                        resolve({
                            days,
                            issuer: cert.issuer
                        });
                    } catch (err) {
                        socket.end();
                        reject(new Error(`Error processing certificate: ${err.message}`));
                    }
                }
            );

            socket.on('error', (err) => {
                console.error('Socket error:', err.message);
                reject(new Error(`Connection error: ${err.message}`));
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

        } catch (error) {
            reject(new Error(`Invalid URL or setup error: ${error.message}`));
        }
    });
}

// Alternative version using a more explicit approach
export async function getCertificateDaysRemainingAlt(targetUrl) {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(targetUrl);
            const hostname = urlObj.hostname;
            const port = parseInt(urlObj.port) || 443;

            const options = {
                host: hostname,
                port: port,
                servername: hostname,
                rejectUnauthorized: false,
                timeout: 10000,
                // Explicitly set TLS version if needed
                secureProtocol: 'TLS_method',
            };

            const socket = tls.connect(options);

            socket.on('secureConnect', () => {
                try {
                    if (!socket.authorized && socket.authorizationError !== 'SELF_SIGNED_CERT_IN_CHAIN') {
                        console.warn('Certificate not authorized:', socket.authorizationError);
                    }

                    const cert = socket.getPeerCertificate();
                    
                    if (!cert || Object.keys(cert).length === 0) {
                        socket.end();
                        return reject(new Error('No certificate received'));
                    }

                    if (!cert.valid_to) {
                        socket.end();
                        return reject(new Error('Certificate has no expiration date'));
                    }
                    
                    const expiry = new Date(cert.valid_to);
                    const now = new Date();
                    
                    if (isNaN(expiry.getTime())) {
                        socket.end();
                        return reject(new Error('Invalid expiration date in certificate'));
                    }

                    const diffTime = expiry - now;
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    socket.end();
                    
                    resolve({
                        days,
                        issuer: cert.issuer
                    });

                } catch (err) {
                    socket.end();
                    reject(new Error(`Certificate processing error: ${err.message}`));
                }
            });

            socket.on('error', (err) => {
                reject(new Error(`TLS connection error: ${err.message}`));
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

        } catch (error) {
            reject(new Error(`Setup error: ${error.message}`));
        }
    });
}