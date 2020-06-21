module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest",
        "^.+\\.jsx?$": "babel-jest",
    },
    globals: {
        __ENV__: "test",
        TNS_ENV: "test",
        "js-test": {
            babelConfig: true,
        },
    },
    setupFiles: ["./app/tests/setup.js"],
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: false,
};
