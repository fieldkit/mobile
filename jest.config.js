module.exports = {
    preset: "ts-jest",
    globals: {
        __ENV__: "test",
        TNS_ENV: "test",
        "ts-jest": {
            diagnostics: true,
        },
    },
    transform: {
        "^.+\\.ts$": "ts-jest",
        "^.+\\.js$": "babel-jest",
    },
    moduleNameMapper: {
        "~/(.*)$": ["<rootDir>/app/$1"],
        "@/(.*)$": ["<rootDir>/app/$1"],
        "^vue$": "vue",
    },
    transformIgnorePatterns: [],
    setupFiles: ["./app/tests/setup.ts"],
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: false,
};
