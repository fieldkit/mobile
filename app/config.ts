import { CONFIG as DeveloperConfig } from "./secrets";

function getBlankDeveloperConfig() {
    return {
        developer: {
            machine: null,
            stationFilter: (url) => {
                return true;
            },
        },
    };
}

function getDeveloperConfig() {
    return DeveloperConfig;
}

interface SimpleConfig {
    vue: { verbose: boolean };
    baseUri: string;
    ingestionUri: string;
    dropTables: boolean;
    lossBufferDelay: number;
}

interface FinalConfig extends SimpleConfig {
    logger: (name: string) => SimpleLogger;
    developer: {
        stationFilter: (url: string) => boolean;
    };
    env: {
        dev: boolean;
        test: boolean;
        developer: boolean;
    };
}

const configs: { [index: string]: SimpleConfig } = {
    default: {
        vue: {
            verbose: false,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        dropTables: true,
        lossBufferDelay: 2000,
    },
    test: {
        vue: {
            verbose: false,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        dropTables: true,
        lossBufferDelay: 0,
    },
};

interface SimpleLogger {
    noop(...args: any[]): void;
    info(...args: any[]): void;
    verbose(...args: any[]): void;
    error(...args: any[]): void;
}

function loggerFactory(name: string): SimpleLogger {
    return {
        noop: function (...args: any[]) {},
        info: function (...args: any[]) {
            args.unshift(name);
            console.log.apply(console, args);
        },
        verbose: function (...args: any[]) {
            args.unshift(name);
            // console.log.apply(console, args);
        },
        error: function (...args: any[]) {
            args.unshift(name);
            console.error.apply(console, args);
        },
    };
}

function getConfig(): FinalConfig {
    const envs = {
        env: {
            dev: /^dev/.test(TNS_ENV),
            test: /^test/.test(TNS_ENV),
            developer: !/^test/.test(TNS_ENV) && DeveloperConfig.dev === true,
        },
    };
    const loggerConfig = {
        logger: loggerFactory,
    };
    if (envs.env.test) {
        return Object.assign({}, envs, configs["test"], loggerConfig, getBlankDeveloperConfig());
    }
    return Object.assign({}, envs, configs["default"], loggerConfig, getDeveloperConfig());
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
