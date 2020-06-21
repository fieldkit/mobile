export class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthenticationError";
        this.authenticated = false;
    }
}

export class StationQueryError extends Error {
    constructor(message) {
        super(message);
        this.name = "StationQueryError";
    }
}

export class QueryThrottledError extends Error {
    constructor(message) {
        super(message);
        this.name = "QueryThrottledError";
    }
}

export class HttpError extends Error {
    constructor(message, response) {
        super(message);
        this.name = "HttpError";
        this.response = response;
    }
}
