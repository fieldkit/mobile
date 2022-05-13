const webpack = require("@nativescript/webpack");
const fs = require("fs");
const { resolve } = require("path");

module.exports = (env) => {
    webpack.init(env);

    // Learn how to customize:
    // https://docs.nativescript.org/webpack

    const packageJson = require("./package.json");

    const gitHash = require("child_process").execSync("git log -1 --format=%h").toString().trim();
    const gitBranchParsed = require("child_process").execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
    const gitBranch = process.env.GIT_LOCAL_BRANCH || gitBranchParsed;

    function buildVersion() {
        const prel = process.env.BUILD_NUMBER || 0;
        return `${packageJson.version}-${gitBranch}.${prel}-${gitHash}`;
    }

    const version = buildVersion();

    console.log("version:", version);

    fs.writeFileSync("version.txt", version);

    webpack.chainWebpack((config) => {
        // change the "@" alias to "app/"
        config.resolve.alias.set("@", resolve(__dirname, "app/"));
        // change the "~" alias to "app/"
        config.resolve.alias.set("~", resolve(__dirname, "app/"));
        config.resolve.alias.set("vue", "nativescript-vue");

        // Compatibility for nativescript-advanced-permissions, should try and remove this eventually.
        config.resolve.alias.set("tns-core-modules/application", "@nativescript/core");

        config.resolve.set("fallback", {
            path: false,
            http: false,
            util: false,
            os: false,
            assert: false,
            https: false,
            zlib: false,
            tty: false,
            fs: false,
            stream: false,
            buffer: "buffer",
            "stream-http": false,
        });

        config.plugin("DefinePlugin").tap((args) => {
            Object.assign(args[0], {
                "global.isProduction": !!env.production,
                TNS_ENV: JSON.stringify("development"),
                FK_VERSION: JSON.stringify(version),
                FK_BUILD_TIMESTAMP: JSON.stringify(process.env.BUILD_TIMESTAMP),
                FK_BUILD_NUMBER: JSON.stringify(process.env.BUILD_NUMBER),
                FK_BUILD_TAG: JSON.stringify(process.env.BUILD_TAG),
                FK_BUILD_JOB: JSON.stringify(process.env.JOB_NAME),
                FK_GIT_COMMIT: JSON.stringify(gitHash),
                FK_GIT_BRANCH: JSON.stringify(gitBranch),
            });

            return args;
        });

        config.entry("application").add("@/application.android.js").end();
    });

    return webpack.resolveConfig();
};
