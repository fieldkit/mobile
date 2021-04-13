@Library('conservify') _

conservifyProperties([ disableConcurrentBuilds() ])

timestamps {
    node ("jenkins-aws-ubuntu") {
        try {
			def scm

            stage ('git') {
                scm = checkout scm
            }

            stage ('build') {
				def (remote, branch) = scm.GIT_BRANCH.tokenize('/')

				withEnv(["GIT_LOCAL_BRANCH=${branch}"]) {
					sh "PATH=$PATH:node_modules/.bin make jenkins"
				}
            }

            notifySuccess()
        }
        catch (Exception e) {
            notifyFailure()
            throw e;
        }
    }
}
