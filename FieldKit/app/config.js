import { CONFIG } from './secrets';

function get_blank_developer_config() {
    return {
        logging: {
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
        baseUri: "https://api.fkdev.org",
        seedDB: true,
        dropTables: true,
        stationTimeoutMs: 30000,
    },
    test: {
        baseUri: "https://api.fkdev.org",
        seedDB: true,
        dropTables: true,
        stationTimeoutMs: 30000,
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
        return function() {
            const args = Array.from(arguments);
            args.unshift(name);
            console.log.apply(console, args);
        };
    }
    return function() {
        // Noop
    };
};

export default final;
