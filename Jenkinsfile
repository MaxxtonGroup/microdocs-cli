pipeline {
  agent any
  parameters {
    choice(choices:"patch\nminor\nmajor", description: 'Increase the patch, minor, major version', name: 'SEM_VERSION')
    string(name: 'MICRODOCS_CORE_VERSION', defaultValue: '', description: 'Version of microdocs-core')
  }

  stages {
    stage("Checkout") {
      steps {
        deleteDir()
        checkout scm
        stash name: 'source'
      }
    }

    stage('Build') {
      steps {
        echo "Installing npm dependencies"
        unstash 'src'
        sh 'npm version ' + env.SEM_VERSION
        sh 'npm install --save @maxxton/microdocs-core@' + env.MICRODOCS_CORE_vERSION
        sh 'npm install'
        stash name: 'build'
      }
    }

    stage('Test') {
      steps {
        echo "Test"
        unstash 'build'
        sh 'npm test'
      }
    }

    stage('PrePublish') {
      steps {
        echo "PrePublish"
        unstash 'build'
        sh 'npm run prepublish'
        dir('dist') {
          stash 'dist'
        }
      }
    }
    stage('Publish') {
      steps {
        dir('dist') {
          echo "Publish"
          unstash 'dist'
          sh 'echo @maxxton:registry=https://npm.maxxton.com > .npmrc'
          sh 'npm publish'
        }
      }
    }
  }
}