import { CONFIG } from './secrets';

function get_blank_developer_config() {
    return {
        logging: {
            SaveLogs: true,
            QueryStation: false,
            DownloadManager: false,
            UploadManager: false,
        },
        developer: {
            machine: null,
            stationFilter: (url) => {
                return true;
            },
        }
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
        seedDB: true,
        dropTables: true,
        stationTimeoutMs: 30000,
        includeInternalModules: false,
        includeInternalSensors: false
    },
    test: {
        vue: {
            verbose: false,
        },
        baseUri: "https://api.fkdev.org",
        ingestionUri: "https://api.fkdev.org/ingestion",
        seedDB: true,
        dropTables: true,
        stationTimeoutMs: 30000,
        includeInternalModules: false,
        includeInternalSensors: false
    }
};

function get_config() {
    if (TNS_ENV === "test") {
        return Object.assign({}, configs["test"], get_blank_developer_config());
    }
    // TODO Recursive deep merge is ideal here.
    return Object.assign({}, configs["default"], get_developer_config());
}

const final = get_config();

final.logger = (name) => {
    if (final.logging[name]) {
        return {
            info: function() {
                const args = Array.from(arguments);
                args.unshift(name);
                console.log.apply(console, args);
            },
            verbose: function() {
                const args = Array.from(arguments);
                args.unshift(name);
                // console.log.apply(console, args);
            },
            error: function() {
                const args = Array.from(arguments);
                args.unshift(name);
                console.error.apply(console, args);
            }
        };
    }
    return {
        info: () => {
        },
        verbose: () => {
        },
        error: () => {
        }
    };
};

export default final;

export const Build = {
    buildTime: FK_BUILD_TIMESTAMP || '',
    buildNumber: FK_BUILD_NUMBER || '',
    buildTag: FK_BUILD_TAG || '',
    commit: FK_GIT_COMMIT || '',
    branch: FK_GIT_BRANCH || '',
};
