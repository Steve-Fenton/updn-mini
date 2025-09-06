import https from 'https';
import http from 'http';

/**
 * Checks if a URL is up and returns the response time in milliseconds.
 * @param {string} targetUrl - The URL to check.
 * @param {Object} options - Optional configuration.
 * @param {number} options.timeout - Request timeout in ms (default: 10000).
 * @param {boolean} options.followRedirects - Whether to follow redirects (default: true).
 * @param {number} options.maxRedirects - Maximum number of redirects to follow (default: 5).
 * @returns {Promise<Object>} - Object containing status, responseTime, statusCode, and statusText.
 */
async function checkUrlHealth(targetUrl, options = {}) {
    const {
        timeout = 10000,
        followRedirects = false,
        maxRedirects = 5
    } = options;

    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(targetUrl);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            let redirectCount = 0;
            const startTime = Date.now();

            const makeRequest = (url) => {
                const urlToCheck = new URL(url);
                
                const requestOptions = {
                    hostname: urlToCheck.hostname,
                    port: urlToCheck.port || (isHttps ? 443 : 80),
                    path: urlToCheck.pathname + urlToCheck.search,
                    method: 'GET',
                    timeout: timeout,
                    headers: {
                        'User-Agent': 'URL-Health-Checker/1.0'
                    }
                };

                const req = client.request(requestOptions, (res) => {
                    const responseTime = Date.now() - startTime;
                    
                    // Handle redirects
                    if (followRedirects && [301, 302, 303, 307, 308].includes(res.statusCode)) {
                        if (redirectCount >= maxRedirects) {
                            return resolve({
                                status: 'error',
                                responseTime,
                                statusCode: res.statusCode,
                                statusText: 'Too many redirects',
                                error: `Maximum redirects (${maxRedirects}) exceeded`
                            });
                        }
                        
                        const location = res.headers.location;
                        if (!location) {
                            return resolve({
                                status: 'error',
                                responseTime,
                                statusCode: res.statusCode,
                                statusText: 'Redirect without location header',
                                error: 'Redirect response missing location header'
                            });
                        }
                        
                        redirectCount++;
                        // Handle relative redirects
                        const redirectUrl = location.startsWith('http') 
                            ? location 
                            : new URL(location, url).href;
                        
                        return makeRequest(redirectUrl);
                    }
                    
                    // Determine status based on HTTP status code
                    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                    
                    resolve({
                        status: isSuccess ? 'up' : 'down',
                        responseTime,
                        statusCode: res.statusCode,
                        statusText: res.statusMessage || getStatusText(res.statusCode),
                        redirectCount,
                        finalUrl: redirectCount > 0 ? url : targetUrl
                    });
                    
                    // Consume response data to free up memory
                    res.resume();
                });

                req.on('error', (err) => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        status: 'down',
                        responseTime,
                        statusCode: 0,
                        statusText: 'Request failed',
                        error: err.message
                    });
                });

                req.on('timeout', () => {
                    req.destroy();
                    const responseTime = Date.now() - startTime;
                    resolve({
                        status: 'down',
                        responseTime,
                        statusCode: 0,
                        statusText: 'Request timeout',
                        error: `Request timed out after ${timeout}ms`
                    });
                });

                req.end();
            };

            makeRequest(targetUrl);

        } catch (error) {
            resolve({
                status: 'error',
                responseTime: 0,
                statusCode: 0,
                statusText: 'Invalid URL',
                error: error.message
            });
        }
    });
}

/**
 * Gets a human-readable status text for HTTP status codes.
 * @param {number} statusCode - The HTTP status code.
 * @returns {string} - Human-readable status text.
 */
function getStatusText(statusCode) {
    const statusTexts = {
        200: 'OK',
        201: 'Created',
        204: 'No Content',
        301: 'Moved Permanently',
        302: 'Found',
        304: 'Not Modified',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    };
    
    return statusTexts[statusCode] || 'Unknown Status';
}

export { checkUrlHealth };