pipeline {
  agent any
  tools { jdk 'jdk21'; maven 'maven3' }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Verify') { steps { sh 'mvn -B -ntp verify' } }
    stage('Question links') { steps { sh 'python3 tools/build_question_index.py --check' } }
    stage('Archive') { steps { archiveArtifacts artifacts: 'target/*.jar', fingerprint: true } }
  }
  post { always { junit 'target/surefire-reports/*.xml' } }
}
