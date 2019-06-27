import { Common } from './zeroconf.common';
export declare class Zeroconf extends Common {
    private nativeApp;
    private context;
    private mNsdManager;
    private NsdManager;
    private mDiscoveryListener;
    constructor(serviceType: string);
    startServiceDiscovery(): void;
    stopServiceDiscovery(): void;
    private resolveService;
    private getAndroidContext;
}
