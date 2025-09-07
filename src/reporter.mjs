export class Reporter {
    constructor(config) {
        const supportedAdapters = ['datadog'];
        this.adapter = supportedAdapters.includes(config.reporter) ? config.reporter : null;
        this.moduleCache = new Map();
    }

    async getModule() {
        if (this.adapter == null) {
            return null;
        }

        let module = this.moduleCache.get(this.adapter);

        if (!module) {
            module = await import(`./reporter-${this.adapter}.mjs`);
            this.moduleCache.set(this.adapter, module);
        }

        return module;
    }

    async certificate(url, daysRemaining, health) {
        const module = await this.getModule();

        module && await module.reportCertificate(url, daysRemaining, health);
    }

    async uptime(url, responseTime, health) {
        const module = await this.getModule();

        module && await module.reportUptime(url, responseTime, health);
    }
}