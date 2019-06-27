import { Observable } from 'tns-core-modules/data/observable';
export declare class Common extends Observable {
    protected serviceType: string;
    constructor(serviceType: string);
    startServiceDiscovery(): void;
    stopServiceDiscovery(): void;
    protected onServiceFound(service: any): void;
    protected onServiceLost(service: any): void;
}
export interface ZeroconfService {
    'name': string;
    'type': string;
    'host': string;
    'port': number;
}
