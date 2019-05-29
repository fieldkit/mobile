@Library('conservify') _

conservifyProperties([ disableConcurrentBuilds() ])

timestamps {
    node () {
        try {
            stage ('git') {
                checkout scm
            }

            stage ('build') {
                sh """
export PATH=$PATH:node_modules/.bin
pushd FieldKit
rm -rf node_modules/*/.git
npm --version
node --version
npm install
npm test
popd
"""
            }

            notifySuccess()
        }
        catch (Exception e) {
            notifyFailure()
            throw e;
        }
    }
}
