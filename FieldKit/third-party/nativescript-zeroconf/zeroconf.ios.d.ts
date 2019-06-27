import { Common } from './zeroconf.common';
export declare class Zeroconf extends Common {
    private netServiceBrowser;
    constructor(serviceType: string);
    startServiceDiscovery(): void;
    stopServiceDiscovery(): void;
    private stopDiscovery;
    private resolveBonjourService;
    private processBonjourService;
}
