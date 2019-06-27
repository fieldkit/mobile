import { Common } from './zeroconf.common';

export declare class Zeroconf extends Common {
  constructor(serviceType: string, serviceDomain?: string);
  startServiceDiscovery(): void;
  stopServiceDiscovery(): void;
}

export * from "./zeroconf.common";
