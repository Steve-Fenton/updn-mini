import { getCertificateDaysRemaining } from './certificate.mjs';
import { checkUrlHealth } from './uptime.mjs';
import util from 'util';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function reportResult(result, message) {
    if (result) {
        console.error(util.styleText('green', message));
    } else {
        console.error(util.styleText('red', message));
    }
}

async function checkCertificates(config, delay) {
    const certificateChecks = config.checks.filter(c => c.type.includes('certificate'));
    if (certificateChecks.length === 0) {
        return;
    }

    await sleep(delay || 0);

    for (let check of certificateChecks) {
        const cert = await getCertificateDaysRemaining(check.url);
        const result = cert.days >= (check.threshold || 30);
        const message = `🔒 Certificate ${check.url} ${cert.issuer.O} ${cert.days}d`;

       reportResult(result, message);

        await sleep(config.delay || 1000);
    }

    await checkCertificates(config, config.delayAfter.certificate);
}

async function checkUptime(config, delay) {
    const uptimeChecks = config.checks.filter(c => c.type.includes('uptime'));
    if (uptimeChecks.length === 0) {
        return;
    }

    await sleep(delay || 0);

    for (let check of uptimeChecks) {
        const response = await checkUrlHealth(check.url);
        const result = response.status === 'up';
        const message = `🌏 Uptime ${check.url} ${response.statusCode}:${response.statusText}`;

        reportResult(result, message);

        await sleep(config.delay || 1000);
    }

    await checkUptime(config, config.delayAfter.uptime);
}

export {checkCertificates, checkUptime};