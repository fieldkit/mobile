import { UdpMessage, ServiceInfo } from "@/store";

export interface DiscoveryListener {
    onFoundService(info: ServiceInfo): void;
    onUdpMessage(info: UdpMessage): void;
    onLostService(info: ServiceInfo): void;
}

export class DiscoveryEvents implements DiscoveryListener {
    constructor(private readonly listeners: DiscoveryListener[] = []) {}

    public onFoundService(info: ServiceInfo): void {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onFoundService(info);
        }
    }

    public onLostService(info: ServiceInfo): void {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onLostService(info);
        }
    }

    public onUdpMessage(message: UdpMessage): void {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onUdpMessage(message);
        }
    }

    public add(listener: DiscoveryListener): void {
        this.listeners.push(listener);
    }
}
