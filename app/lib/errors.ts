export class AuthenticationError extends Error {
    public readonly authenticated = false;

    constructor(message) {
        super(message);
        this.name = "AuthenticationError";
    }

    public static isInstance(error: any): boolean {
        return error.authenticated === false;
    }
}

export class StationQueryError extends Error {
    public readonly stationQuery = false;

    constructor(message) {
        super(message);
        this.name = "StationQueryError";
    }

    public static isInstance(error: any): boolean {
        return error.stationQuery === true;
    }
}

export class BusyError extends Error {
    public readonly busy = false;

    constructor(message) {
        super(message);
        this.name = "BusyError";
    }

    public static isInstance(error: any): boolean {
        return error.busy === true;
    }
}

export class QueryThrottledError extends Error {
    public readonly throttled = true;

    constructor(message) {
        super(message);
        this.name = "QueryThrottledError";
    }

    public static isInstance(error: any): boolean {
        return error.throttled === true;
    }
}

export class HttpError extends Error {
    public readonly http = true;

    constructor(message, public readonly response: any) {
        super(message);
        this.name = "HttpError";
    }

    public static isInstance(error: any): boolean {
        return error.http === true;
    }
}
