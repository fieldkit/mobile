export class UdpMessage {
    constructor(public readonly address: string, public readonly data: string) {}
}

export class FoundService {
    constructor(public readonly type: string, public readonly name: string, public readonly host: string, public readonly port: number) {}
}

export class LostService {
    constructor(public readonly type: string, public readonly name: string) {}
}

export interface DiscoveryListener {
    onFoundService(info: FoundService): void;
    onLostService(info: LostService): void;
    onUdpMessage(info: UdpMessage): void;
}

export class DiscoveryEvents implements DiscoveryListener {
    constructor(private readonly listeners: DiscoveryListener[] = []) {}

    public onFoundService(info: FoundService): void {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i].onFoundService(info);
        }
    }

    public onLostService(info: LostService): void {
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
