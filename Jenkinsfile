@Library('conservify') _

conservifyProperties([ disableConcurrentBuilds() ])

timestamps {
    node ("jenkins-aws-ubuntu") {
        try {
            stage ('git') {
                checkout scm
            }

            stage ('build') {
                sh "PATH=$PATH:node_modules/.bin make jenkins"
            }

            notifySuccess()
        }
        catch (Exception e) {
            notifyFailure()
            throw e;
        }
    }
}
