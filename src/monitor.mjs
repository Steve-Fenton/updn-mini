import { getCertificateDaysRemaining } from './certificate.mjs';
import { checkUrlHealth } from './uptime.mjs';
import { Reporter } from './reporter.mjs';
import util from 'util';

export class Monitor {
    constructor(config) {
        this.config = config;
        this.reporter = new Reporter(config);
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static reportResult(result, message) {
        if (result) {
            console.error(util.styleText('green', message));
        } else {
            console.error(util.styleText('red', message));
        }
    }

    async checkCertificates(delay) {
        const certificateChecks = this.config.checks.filter(c => c.type.includes('certificate'));
        if (certificateChecks.length === 0) {
            return;
        }

        await Monitor.sleep(delay || 0);

        for (let check of certificateChecks) {
            const cert = await getCertificateDaysRemaining(check.url);
            const result = cert.days >= (check.threshold || 30);
            const message = `🔒 Certificate ${check.url} ${cert.issuer.O} ${cert.days}d`;

            Monitor.reportResult(result, message);

            const health = result ? 'healthy' : (cert.days < 1 ? 'critical' : 'warning');
            await this.reporter.certificate(check.url, cert.days, cert.days, health);

            await Monitor.sleep(this.config.delay || 1000);
        }

        await this.checkCertificates(this.config.delayAfter.certificate);
    }

    async checkUptime(delay) {
        const uptimeChecks = this.config.checks.filter(c => c.type.includes('uptime'));
        if (uptimeChecks.length === 0) {
            return;
        }

        await Monitor.sleep(delay || 0);

        for (let check of uptimeChecks) {
            const response = await checkUrlHealth(check.url);
            const result = response.status === 'up';
            const message = `🌏 Uptime ${check.url} ${response.statusCode}:${response.statusText}`;

            Monitor.reportResult(result, message);

            await Monitor.sleep(this.config.delay || 1000);
        }

        await this.checkUptime(this.config.delayAfter.uptime);
    }
}