import { LocalConfig } from "./local-config";
import developerConfig from "./secrets";

function getBlankLocalConfig(): LocalConfig {
    return {
        vue: {
            verbose: false,
        },
        dev: false,
        beta: false,
        baseUri: "http://192.168.0.100:8080",
        ingestionUri: "http://192.168.0.100:8080/ingestion",
        debugging: {
            machine: null,
        },
        db: {
            drop: false,
        },
        defaultUsers: [],
        defaultNetworks: [],
        mapbox: {
            token: "",
            style: "",
        },
        lossBufferDelay: 0,
    };
}

function getLocalConfig(): LocalConfig {
    return developerConfig;
}

interface FinalConfig extends LocalConfig {
    logger: (name: string) => SimpleLogger;
    env: {
        dev: boolean;
        test: boolean;
        developer: boolean;
    };
    debugging: {
        machine: string | null;
    };
}

const configs: { [index: string]: Partial<LocalConfig> } = {
    default: {
        vue: {
            verbose: false,
        },
        db: {
            drop: true,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        lossBufferDelay: 2000,
    },
    test: {
        vue: {
            verbose: false,
        },
        db: {
            drop: true,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        lossBufferDelay: 0,
    },
};

interface SimpleLogger {
    noop(...args: unknown[]): void;
    info(...args: unknown[]): void;
    verbose(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

function loggerFactory(name: string): SimpleLogger {
    return {
        noop: function (..._args: unknown[]) {
            //
        },
        info: function (...args: unknown[]) {
            args.unshift(name);
            // eslint-disable-next-line
            console.log.apply(console, args);
        },
        verbose: function (...args: unknown[]) {
            args.unshift(name);
            // eslint-disable-next-line
            // console.log.apply(console, args);
        },
        error: function (...args: unknown[]) {
            args.unshift(name);
            // eslint-disable-next-line
            console.error.apply(console, args);
        },
    };
}

function getConfig(): FinalConfig {
    const envs = {
        env: {
            dev: /^dev/.test(TNS_ENV),
            test: /^test/.test(TNS_ENV),
            developer: !/^test/.test(TNS_ENV) && developerConfig.dev === true,
        },
    };
    const loggerConfig = {
        logger: loggerFactory,
    };
    if (envs.env.test) {
        return Object.assign({}, envs, configs["test"], loggerConfig, getBlankLocalConfig()) as FinalConfig;
    }
    return Object.assign({}, envs, configs["default"], loggerConfig, getLocalConfig()) as FinalConfig;
}

export const Build = {
    buildTime: FK_BUILD_TIMESTAMP || "",
    buildNumber: FK_BUILD_NUMBER || "",
    buildTag: FK_BUILD_TAG || "",
    gitHash: FK_GIT_COMMIT || "",
    gitBranch: FK_GIT_BRANCH || "",
};

const final: FinalConfig = getConfig();

export default final;
