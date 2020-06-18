import { Observable } from "tns-core-modules/data/observable";
export declare class Common extends Observable {
    constructor();
}
export declare class ConnectionError extends Error {
    constructor(message: any, info: any);
}
