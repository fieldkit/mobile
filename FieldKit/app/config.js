import { CONFIG } from './secrets';

function get_developer_config() {
    if (!CONFIG) {
        return {
            logging: {
                station_queries: false
            },
            developer: {
                machine: null
            }
        };
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

const base = TNS_ENV === "test" ? configs["test"] : configs["default"];

// TODO Recursive deep merge is ideal here.
const final = Object.assign({}, base, get_developer_config());

export default final;
