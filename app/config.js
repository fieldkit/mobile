import { CONFIG } from "./secrets";

function get_blank_developer_config() {
    return {
        logging: {
            SaveLogs: true,
            EnableAll: true,
            /*
            QueryStation: false,
            DownloadManager: false,
            UploadManager: false,
            CalibrationService: true,
            DiscoverStation: true,
            NativeScriptConservify: true,
            StationFirmware: true,
			*/
        },
        developer: {
            machine: null,
            stationFilter: (url) => {
                return true;
            },
        },
    };
}

function get_developer_config() {
    if (!CONFIG) {
        return get_blank_developer_config();
    }
    return CONFIG;
}

const configs = {
    default: {
        vue: {
            verbose: false,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        dropTables: true,
        stationTimeoutMs: 90000,
        includeInternalModules: false,
        includeInternalSensors: false,
        syncMode: "auto",
        lossBufferDelay: 2000,
    },
    test: {
        vue: {
            verbose: false,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        dropTables: true,
        stationTimeoutMs: 90000,
        includeInternalModules: false,
        includeInternalSensors: false,
        syncMode: "auto",
        lossBufferDelay: 0,
    },
};

function get_config() {
    const envs = {
        env: {
            dev: /^dev/.test(TNS_ENV),
            test: /^test/.test(TNS_ENV),
            developer: !/^test/.test(TNS_ENV) && CONFIG.env === true,
        },
    };
    if (TNS_ENV === "test") {
        return Object.assign({}, envs, configs["test"], get_blank_developer_config());
    }
    return Object.assign({}, envs, configs["default"], get_developer_config());
}

const final = get_config();

const disabledByEnv = {
    test: { Migrations: true },
};

final.logger = (name) => {
    if (final.logging.EnableAll || final.logging[name]) {
        const byEnv = disabledByEnv[TNS_ENV] || [];
        if (!(byEnv[name] === true)) {
            return {
                noop: function () {
                    // Do nothing
                },
                info: function () {
                    const args = Array.from(arguments);
                    args.unshift(name);
                    console.log.apply(console, args);
                },
                verbose: function () {
                    const args = Array.from(arguments);
                    args.unshift(name);
                    // console.log.apply(console, args);
                },
                error: function () {
                    const args = Array.from(arguments);
                    args.unshift(name);
                    console.error.apply(console, args);
                },
            };
        }
    }
    return {
        info: () => {},
        verbose: () => {},
        error: () => {},
    };
};

export default final;

export const Build = {
    buildTime: FK_BUILD_TIMESTAMP || "",
    buildNumber: FK_BUILD_NUMBER || "",
    buildTag: FK_BUILD_TAG || "",
    gitHash: FK_GIT_COMMIT || "",
    gitBranch: FK_GIT_BRANCH || "",
};
