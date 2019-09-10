import { CONFIG } from './secrets';

function get_blank_developer_config() {
    return {
        logging: {
            station_queries: false,
            downloading: false,
            uploading: false,
        },
        developer: {
            machine: null
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
    },
    test: {
        baseUri: "https://api.fkdev.org",
        seedDB: true,
        dropTables: true,
    }
};

function get_config() {
    if (TNS_ENV === "test") {
        return Object.assign({}, configs["test"], get_blank_developer_config());
    }
    // TODO Recursive deep merge is ideal here.
    return Object.assign({}, configs["default"], get_developer_config());
}

export default get_config();
