export class AuthenticationError extends Error {
    authenticated = false;

    constructor(message) {
        super(message);
        this.name = "AuthenticationError";
    }
}

export class StationQueryError extends Error {
    constructor(message) {
        super(message);
        this.name = "StationQueryError";
    }
}

export class BusyError extends Error {
    constructor(message) {
        super(message);
        this.name = "BusyError";
    }
}

export class QueryThrottledError extends Error {
    constructor(message) {
        super(message);
        this.name = "QueryThrottledError";
    }
}

export class HttpError extends Error {
    constructor(message, public readonly response: any) {
        super(message);
        this.name = "HttpError";
    }
}
