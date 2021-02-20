import { HttpResponse } from "@/wrappers/networking";

export class AuthenticationError extends Error {
    public readonly authenticated = false;

    constructor(message: string) {
        super(message);
        this.name = "AuthenticationError";
    }

    public static isInstance(error: AuthenticationError): boolean {
        if (!error) return false;
        return error.authenticated === false;
    }
}

export class StationQueryError extends Error {
    public readonly stationQuery = false;

    constructor(message: string) {
        super(message);
        this.name = "StationQueryError";
    }

    public static isInstance(error: StationQueryError): boolean {
        if (!error) return false;
        return error.stationQuery !== undefined;
    }
}

export class BusyError extends Error {
    public readonly busy = false;

    constructor(message: string) {
        super(message);
        this.name = "BusyError";
    }

    public static isInstance(error: BusyError): boolean {
        if (!error) return false;
        return error.busy !== undefined;
    }
}

export class QueryThrottledError extends Error {
    public readonly throttled = true;

    constructor(message: string) {
        super(message);
        this.name = "QueryThrottledError";
    }

    public static isInstance(error: QueryThrottledError): boolean {
        if (!error) return false;
        return error.throttled === true;
    }
}

export class HttpError extends Error {
    public readonly http = true;

    constructor(message: string, public readonly response: HttpResponse) {
        super(message);
        this.name = "HttpError";
    }

    public static isInstance(error: HttpError): boolean {
        if (!error) return false;
        return error?.http === true;
    }
}

export class CalibrationError extends Error {
    public readonly calibration = true;

    constructor(message: string) {
        super(message);
    }

    public static isInstance(error: CalibrationError): boolean {
        if (!error) return false;
        return error?.calibration === true;
    }
}

export class StationError extends Error {
    constructor(message: string) {
        super(message);
    }
}
