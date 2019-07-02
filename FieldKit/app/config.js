const configs = {
    default: {
        baseUri: "https://api.fkdev.org",
        seedDB: true,
        dropTables: true
    },
    test: {
        baseUri: "https://api.fkdev.org",
        seedDB: true,
        dropTables: true
    }
};

export default TNS_ENV === "test" ? configs["test"] : configs["default"];
