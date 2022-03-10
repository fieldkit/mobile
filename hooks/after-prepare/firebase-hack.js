var path = require("path");
var fs = require("fs");

module.exports = function ($logger, $projectData) {
    return new Promise(function (resolve, reject) {
        const today = new Date();
        const expiration = new Date(today.valueOf());
        expiration.setDate(expiration.getDate() + 31);

        $logger.info("Hacking firebase", today);
        $logger.info("Hacking firebase", today);
        $logger.info("Hacking firebase", today);

        if (today > expiration) {
            throw new Error("Check status of Firebase build bug.");
        }

        let projectBuildGradlePath = path.join($projectData.platformsDir, "android", "build.gradle");
        if (fs.existsSync(projectBuildGradlePath)) {
            let buildGradleContent = fs.readFileSync(projectBuildGradlePath).toString();

            const marker = `classpath "org.codehaus.groovy:groovy-all:3.0.8"`;

            const latestGoogleFirebaseAnalyticsClasspath = `classpath "com.google.firebase:firebase-crashlytics-gradle:2.3.0"`;
            // Right now this is fooled by some exception text that's in the build.android file which ends up with this string due to a bug. For now we just do both of them together and cross our fingers.
            /*
            if (buildGradleContent.indexOf(latestGoogleFirebaseAnalyticsClasspath) === -1) {
                $logger.info("Hacking firebase: Need google crashlytics");

                buildGradleContent = buildGradleContent.replace(marker, marker + "\n\t" + latestGoogleFirebaseAnalyticsClasspath);
            }
            */

            const latestGoogleServicesPlugin = 'classpath "com.google.gms:google-services:4.3.4"';
            if (buildGradleContent.indexOf(latestGoogleServicesPlugin) === -1) {
                $logger.info("Hacking firebase: Need google services");

                buildGradleContent = buildGradleContent.replace(
                    marker,
                    marker + "\n\t" + latestGoogleServicesPlugin + "\n\t" + latestGoogleFirebaseAnalyticsClasspath
                );
            }

            fs.writeFileSync(projectBuildGradlePath, buildGradleContent);
        }

        resolve();
    });
};
