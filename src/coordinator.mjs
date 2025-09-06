import { getCertificateDaysRemaining } from './certificate.mjs';
import { checkUrlHealth } from './uptime.mjs';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkCertificates(config, delay) {
    const certificateChecks = config.checks.filter(c => c.type === 'certificate');
    if (certificateChecks.length === 0) {
        return;
    }

    await sleep(delay || 0);

    for (let check of certificateChecks) {
        const days = await getCertificateDaysRemaining('https://example.com');
        const result = days >= (check.threshold || 30);
        const message = `🔒 Certificate', ${check.url} ${days}d`;

        if (result) {
            console.log(message);
        } else {
            console.error(message);
        }

        await sleep(config.delay || 1000);
    }

    await checkCertificates(config, config.delayAfter.certificate);
}

async function checkUptime(config, delay) {
    const uptimeChecks = config.checks.filter(c => c.type === 'uptime');
    if (uptimeChecks.length === 0) {
        return;
    }

    await sleep(delay || 0);

    for (let check of uptimeChecks) {
        const response = await checkUrlHealth(check.url);
        const result = response.status === 'up';
        const message = `🌏 Uptime', ${check.url} ${response.statusCode}:${response.statusText}`;

        if (result) {
            console.log(message);
        } else {
            console.error(message);
        }

        await sleep(config.delay || 1000);
    }

    await checkUptime(config, config.delayAfter.uptime);
}

export {checkCertificates, checkUptime};