export class ServiceList {
    _services = [];
    add(service) {
        this._services.push(service);
    }
    async startAll() {
        for await (const service of this._services) {
            await service.start();
        }
    }
    async stopAll() {
        const services = this._services.reverse();
        for await (const service of services) {
            await service.stop();
        }
    }
}
//# sourceMappingURL=ServiceList.js.map