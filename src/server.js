import express from "express";
import http from "http";
import WebSocket from "ws";

/* 자바스크립트에서 서버 실행
var express = require('express');
var app = express();
 */

const app = express();

app.locals.title = 'My App';

app.set("view engine", "pug");
app.set("views", __dirname + "/views"); // __dirname 는 실행중인 스크립트의 경로
app.use("/public", express.static(__dirname + "/public")); // express.static 으로 정적파일 제공

app.get('/', function (req, res) {
    // res.send('Welcome to ' + app.locals.title);
    res.render('home');
});

app.get('/*', (_, res) => { res.redirect("/") });

app.get('/index', function (req, res) {
    res.send('Backend Server');
});

app.route('/book')
    .get(function (req, res) {
        res.send('Get a book');
    })
    .post(function (req, res) {
        res.send('Add a book');
    })
    .put(function (req, res) {
        res.send('Update a book');
    });

const handleListen = () => console.log(app.locals.title + ' is listening on port 3000');

// http 서버를 생성하기 위해서 listen 제거
// app.listen(3000, function () {
//     console.log(app.locals.title + ' is listening on port 3000');
// }); 

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function handleConnection(socket) {
    console.log(socket);
    socket.on('message', (message) => {
        console.log(`${message}`);
        socket.send('서버에서 메시지를 전송합니다.');
    });
    socket.on('close', () => {
        console.log('클라이언트 연결이 종료되었습니다.');
    });
}

wss.on('connection', handleConnection);

server.listen(3000, handleListen);
