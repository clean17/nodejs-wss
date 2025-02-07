# Noom

Zoom Clone using NodeJS, WebRTC and Websockets

- ws라이브러리를 이용한 채팅 <br>
https://velog.io/@merci/nodejs-wss
- socketIO를 이용한 채팅 <br>
https://velog.io/@merci/Socket-I.O
- WebRTC를 이용한 영상회의 <br>
https://velog.io/@merci/MediaStream-API-WebRTC

## npm 초기화

- 목적: 프로젝트의 종속성(Dependencies)과 메타데이터를 관리</br>

`npm init -y` 명령을 실행하면 `package.json`이 생성된다

`npm init` 이후 `npm`으로 설치하는 패키지들은 자동으로 `package.json`에 등록된다

이후 다른 PC에서 `npm i` 명령을 실행하면 `package.json`을 참조하여 `node_modules` 폴더에 패키지가 설치된다

### Nodemon
Node.js 애플리케이션을 자동으로 다시 시작해주는 도구
- 설치

프로젝트에만 설치
```
npm install --save-dev nodemon
```
--save-dev 옵션을 사용하여 개발 의존성(devDependencies) 으로 추가

- 실행방법

  node app.js 대신
```
nodemon app.js
```
또는 `package.json` 에 아래 부분 추가하여 
```
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```
`npm run dev` 명령어로 실행
- 추가 설정

특정 파일 확장자 감지
```
nodemon --ext js,json
```
.`js`나 `.json` 파일이 변경될 때만 다시 시작한다

또는 실행 파일을 지정하는 방법

`nodemon.json`파일을 만들고 아래 부분을 추가 변경을 감지하면 자동 재시작한다
```
{
  "watch": ["server", "config"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "exec": "node server.js"
}
```
watch: 감시할 디렉토리 지정

ext: 감시할 파일 확장자 지정

ignore: 특정 폴더 무시

exec: 실행할 명령어 지정
