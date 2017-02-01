def projectFolder = 'microdocs-cli';
def newVersion = '';
def semver = input message: 'Increase the patch, minor, major version', parameters: [choice(choices: "patch\nminor\nmajor", description: 'Increase the patch, minor, major version', name: 'SEM_VERSION')]
def microdocsCoreVersion = input message: 'Version microdocs-core', parameters: [string(defaultValue: '', description: 'Version of microdocs-core', name: 'MICRODOCS_CORE_VERSION')]
node {
    stage('Checkout'){
        deleteDir()
        echo "Checkout git"
        checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, submoduleCfg: [], userRemoteConfigs: [[url: 'ssh://git@github.com:MaxxtonGroup/microdocs-cli.git', branch: 'master', credentialsId: '12345-1234-4696-af25-123455']]])
        stash name: 'src'
    }
    stage('Build'){
        echo "Installing npm dependencies"
        unstash 'src'
        newVersion = sh(returnStdout: true, script: 'npm version ' + semver).trim()
        sh 'npm install --save @maxxton/microdocs-core@' + microdocsCoreVersion
        sh 'npm install'
        stash name: 'build'
    }

    stage('Test'){
        echo "Test"
        unstash 'build'
        sh 'npm test'
    }

    stage('PrePublish'){
        echo "PrePublish"
        unstash 'build'
        sh 'npm run prepublish'
        dir('dist'){
            stash 'dist'
        }
    }

    stage('Git Tag'){
        sh 'git push'
        sh 'git push origin ' + projectName + '_' + newVersion
    }

    stage('Publish'){
        dir('dist'){
            echo "Publish"
            unstash 'dist'
            sh 'echo @maxxton:registry=https://npm.maxxton.com > .npmrc'
            sh 'npm publish'
        }
    }
}