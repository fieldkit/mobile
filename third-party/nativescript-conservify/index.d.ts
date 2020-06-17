import { Common } from './conservify.common';

export declare class Conservify extends Common {
    constructor();
    start(serviceType: any): Promise<{}>;
    json(info: any): Promise<{}>;
    protobuf(info: any): Promise<{}>;
    download(info: any): Promise<{}>;
    scanNetworks(): Promise<{}>;
}
