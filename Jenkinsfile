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
cd FieldKit
rm -rf node_modules/*/.git
npm --version
node --version
npm install
npm test
cd ..
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
