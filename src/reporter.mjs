export class Reporter {
    constructor(config) {
        const supportedAdapters = ['datadog'];
        this.adapter = supportedAdapters.includes(config.reporter) ? config.reporter : null;
        this.moduleCache = new Map();
    }

    async certificate(url, daysRemaining, health) {
        if (this.adapter == null) {
            return;
        }

        let module = this.moduleCache.get(this.adapter);

        if (!module) {
            module = await import(`./reporter-${this.adapter}.mjs`);
            this.moduleCache.set(this.adapter, module);
        }

        return await module.reportCertificate(url, daysRemaining, health);
    }
}